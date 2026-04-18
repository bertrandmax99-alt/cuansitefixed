<script>
  // Polyfill setter for fetch to prevent "Cannot set property fetch"
  if (typeof window !== "undefined") {
      try {
          const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
          if (desc && !desc.set) {
              const originalFetch = window.fetch;
              Object.defineProperty(window, 'fetch', {
                  get() { return originalFetch; },
                  set(v) { 
                      console.log("Something tried to overwrite fetch!"); 
                  },
                  configurable: true
              });
          }
      } catch (e) {}
  }
</script>
