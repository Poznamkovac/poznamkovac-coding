# Test for Cell 1 (Basic HTML)

```javascript
async function test(context) {
  const results = [];
  const dom = context.dom;
  if (!dom) {
    results.push({
      name: "DOM availability",
      passed: false,
      error: "DOM context not available",
    });
    return results;
  }
  const container = dom.getElementById("container");
  if (!container) {
    results.push({
      name: "Container element",
      passed: false,
      error: "Element with id 'container' should exist",
    });
  } else {
    results.push({
      name: "Container element",
      passed: true,
    });
    const h1 = container.querySelector("h1");
    if (!h1 || h1.textContent !== "Hello Web!") {
      results.push({
        name: "H1 element",
        passed: false,
        error: "H1 should contain 'Hello Web!'",
      });
    } else {
      results.push({
        name: "H1 element",
        passed: true,
      });
    }
    const p = container.querySelector("p");
    if (!p) {
      results.push({
        name: "Paragraph element",
        passed: false,
        error: "Paragraph element should exist",
      });
    } else {
      results.push({
        name: "Paragraph element",
        passed: true,
      });
    }
  }

  return results;
}
```

# Test for Cell 2 (Add Styling)

```javascript
async function test(context) {
  const results = [];
  const dom = context.dom;
  const styledBox = dom.getElementById("styled-box");
  if (!styledBox) {
    results.push({
      name: "Styled box element",
      passed: false,
      error: "Element with id 'styled-box' should exist",
    });
    return results;
  }

  results.push({
    name: "Styled box element",
    passed: true,
  });
  const styles = dom.querySelectorAll("style");
  if (styles.length === 0) {
    results.push({
      name: "CSS styling",
      passed: false,
      error: "Style element should be defined",
    });
  } else {
    results.push({
      name: "CSS styling",
      passed: true,
    });
  }

  return results;
}
```

# Test for Cell 3 (Interactive Button)

```javascript
async function test(context) {
  const results = [];
  const dom = context.dom;
  const button = dom.getElementById("myButton");
  if (!button) {
    results.push({
      name: "Button element",
      passed: false,
      error: "Button with id 'myButton' should exist",
    });
  } else {
    results.push({
      name: "Button element",
      passed: true,
    });
  }
  const output = dom.getElementById("output");
  if (!output) {
    results.push({
      name: "Output element",
      passed: false,
      error: "Div with id 'output' should exist",
    });
  } else {
    results.push({
      name: "Output element",
      passed: true,
    });
  }
  if (typeof context.window.handleClick !== "function") {
    results.push({
      name: "handleClick function",
      passed: false,
      error: "handleClick function should be defined",
    });
  } else {
    results.push({
      name: "handleClick function",
      passed: true,
    });
  }

  return results;
}
```

# Test for Cell 4 (Dynamic List)

```javascript
async function test(context) {
  const results = [];
  const dom = context.dom;
  const stats = dom.getElementById("stats");
  if (!stats) {
    results.push({
      name: "Statistics element",
      passed: false,
      error: "Element with id 'stats' should exist",
    });
  } else {
    results.push({
      name: "Statistics element",
      passed: true,
    });
  }
  const totalClicks = dom.getElementById("totalClicks");
  if (!totalClicks) {
    results.push({
      name: "Total clicks display",
      passed: false,
      error: "Span with id 'totalClicks' should exist",
    });
  } else {
    results.push({
      name: "Total clicks display",
      passed: true,
    });
  }
  if (typeof context.window.clickCount === "undefined") {
    results.push({
      name: "Shared clickCount variable",
      passed: false,
      error: "clickCount variable should be accessible from previous cell",
    });
  } else {
    results.push({
      name: "Shared clickCount variable",
      passed: true,
    });
  }

  return results;
}
```
