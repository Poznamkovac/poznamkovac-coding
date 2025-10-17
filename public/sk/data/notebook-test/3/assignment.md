# Web Development Notebook

Build interactive web components step by step.

## Basic HTML

Create a simple HTML structure:

```
<div id="container">
  <h1>Hello Web!</h1>
  <p>This is a paragraph.</p>
</div>
```

## Add Styling

Style the elements with CSS:

```
<style>
  #styled-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    margin: 10px 0;
  }
</style>

<div id="styled-box">
  <h2>Styled Box</h2>
  <p>Beautiful gradient background!</p>
</div>
```

## Interactive Button

Add JavaScript functionality:

```[readonly,mustExecute]
<script>
  let clickCount = 0;
</script>
```

Now create an interactive button:

```
<button id="myButton" onclick="handleClick()" style="
  padding: 10px 20px;
  font-size: 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
">
  Click me!
</button>

<div id="output" style="margin-top: 10px; font-size: 18px;"></div>

<script>
  function handleClick() {
    clickCount++;
    document.getElementById('output').innerHTML =
      `Button clicked ${clickCount} time(s)!`;
  }
</script>
```

## Dynamic List

Create a dynamic list that uses the shared clickCount variable:

```
<div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
  <h3>Click Statistics</h3>
  <ul id="stats">
    <li>Total clicks: <span id="totalClicks">0</span></li>
  </ul>
</div>

<script>
  // Update the stats using the shared clickCount variable
  document.getElementById('totalClicks').textContent = clickCount;

  // Set up an interval to update every second
  setInterval(() => {
    document.getElementById('totalClicks').textContent = clickCount;
  }, 100);
</script>
```

## Summary

You've created:
- HTML structure
- CSS styling
- Interactive JavaScript elements
- Shared variables between cells
