import { useEffect, useState } from 'react';
import { useConsent } from '@/hooks/useConsent';
import { generateScriptTags, recordScriptPerformance } from '@/services/trackingService';
import { ScriptLocation } from '@/types/tracking';

interface ScriptPerformance {
  scriptId: string;
  loadStartTime: number;
  executionStartTime: number | null;
  loadEndTime: number | null;
  executionEndTime: number | null;
  errors: { message: string; timestamp: string; stackTrace?: string }[];
}

const TrackingScriptManager = () => {
  const { consented, consentedCategories } = useConsent();
  const [scriptsInjected, setScriptsInjected] = useState(false);
  const [scriptPerformance, setScriptPerformance] = useState<Record<string, ScriptPerformance>>({});

  // Add error listener
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if error is from one of our tracking scripts
      const scriptId = event.filename?.match(/scriptId=([^&]+)/)?.[1];
      
      if (scriptId && scriptPerformance[scriptId]) {
        setScriptPerformance(prev => ({
          ...prev,
          [scriptId]: {
            ...prev[scriptId],
            errors: [
              ...prev[scriptId].errors,
              {
                message: event.message,
                timestamp: new Date().toISOString(),
                stackTrace: event.error?.stack
              }
            ]
          }
        }));
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [scriptPerformance]);

  // Inject scripts when consent changes
  useEffect(() => {
    const injectScripts = async () => {
      if (!consented || scriptsInjected) return;
      
      try {
        const scriptTags = await generateScriptTags(consentedCategories);
        
        // Inject scripts for each location
        Object.entries(scriptTags).forEach(([location, scripts]) => {
          if (!scripts.trim()) return;
          
          // Parse individual scripts
          const parser = new DOMParser();
          const doc = parser.parseFromString(`<div>${scripts}</div>`, 'text/html');
          const scriptElements = doc.querySelectorAll('script');
          
          scriptElements.forEach(script => {
            // Extract script ID from data attribute or generate one
            const scriptId = script.getAttribute('data-script-id') || `script-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Create new performance tracking entry
            setScriptPerformance(prev => ({
              ...prev,
              [scriptId]: {
                scriptId,
                loadStartTime: performance.now(),
                executionStartTime: null,
                loadEndTime: null,
                executionEndTime: null,
                errors: []
              }
            }));
            
            // Create a new script element
            const newScript = document.createElement('script');
            
            // Copy attributes
            Array.from(script.attributes).forEach(attr => {
              newScript.setAttribute(attr.name, attr.value);
            });
            
            // Add data attribute for identification
            newScript.setAttribute('data-script-id', scriptId);
            
            // Add performance tracking
            newScript.addEventListener('load', () => {
              setScriptPerformance(prev => ({
                ...prev,
                [scriptId]: {
                  ...prev[scriptId],
                  loadEndTime: performance.now(),
                  executionStartTime: performance.now()
                }
              }));
            });
            
            // Set content
            newScript.textContent = script.textContent;
            
            // Inject into appropriate location
            if (location === 'head') {
              document.head.appendChild(newScript);
            } else if (location === 'body-start') {
              document.body.insertBefore(newScript, document.body.firstChild);
            } else {
              document.body.appendChild(newScript);
            }
          });
        });
        
        setScriptsInjected(true);
      } catch (error) {
        console.error('Error injecting tracking scripts:', error);
      }
    };

    injectScripts();
  }, [consented, consentedCategories, scriptsInjected]);

  // Record performance metrics
  useEffect(() => {
    const recordPerformanceData = async () => {
      // Only record once page is fully loaded and we have performance data
      if (!scriptsInjected || document.readyState !== 'complete') return;
      
      try {
        // Calculate final execution time once page is loaded
        const updatedPerformance = { ...scriptPerformance };
        
        Object.keys(updatedPerformance).forEach(scriptId => {
          // Only update scripts that have started execution but not finished
          if (
            updatedPerformance[scriptId].executionStartTime && 
            !updatedPerformance[scriptId].executionEndTime
          ) {
            updatedPerformance[scriptId].executionEndTime = performance.now();
          }
        });
        
        setScriptPerformance(updatedPerformance);
        
        // Record performance for each script
        await Promise.all(
          Object.values(updatedPerformance).map(async (perf) => {
            // Ensure we have complete timing data
            if (perf.loadEndTime && perf.executionEndTime) {
              const loadTime = perf.loadEndTime - perf.loadStartTime;
              const executionTime = perf.executionEndTime - (perf.executionStartTime || perf.loadEndTime);
              
              // Calculate impact score based on load and execution times
              // This is a simple algorithm that can be improved
              const loadImpact = Math.min(10, loadTime / 200);
              const executionImpact = Math.min(10, executionTime / 100);
              const impactScore = Math.round((loadImpact + executionImpact) / 2);
              
              await recordScriptPerformance({
                scriptId: perf.scriptId,
                loadTime: Math.round(loadTime),
                executionTime: Math.round(executionTime),
                impactScore,
                errors: perf.errors
              });
            }
          })
        );
      } catch (error) {
        console.error('Error recording script performance:', error);
      }
    };

    // Listen for window load to ensure all scripts have executed
    window.addEventListener('load', recordPerformanceData);
    
    return () => {
      window.removeEventListener('load', recordPerformanceData);
    };
  }, [scriptsInjected, scriptPerformance]);

  // This component doesn't render anything
  return null;
};

export default TrackingScriptManager; 