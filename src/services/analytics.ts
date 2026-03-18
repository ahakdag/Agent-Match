// Basic Analytics Service (Stub for PostHog/Google Analytics)
export const trackEvent = (eventName: string, properties?: any) => {
  console.log(`[Analytics] Event: ${eventName}`, properties);
  // In a real app, you'd call your analytics provider here:
  // posthog.capture(eventName, properties);
};

export const trackPageView = (viewName: string) => {
  console.log(`[Analytics] Page View: ${viewName}`);
  // posthog.capture('$pageview', { view: viewName });
};
