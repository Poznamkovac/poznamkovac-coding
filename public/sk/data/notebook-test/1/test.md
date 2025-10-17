# Test for Cell 1 (Calculate circle area)

```python
# Test that the radius and area variables are defined correctly
results = []

# Check if radius is defined
if 'radius' not in dir():
    results.append((False, "Variable 'radius' check", "Variable 'radius' should be defined"))
elif radius != 5:
    results.append((False, "Variable 'radius' check", f"radius should be 5, got {radius}"))
else:
    results.append((True, "Variable 'radius' check", ""))

# Check if area is defined and calculated correctly
expected_area = 3.141592653589793 * 25  # math.pi * 5^2
if 'area' not in dir():
    results.append((False, "Variable 'area' check", "Variable 'area' should be defined"))
elif abs(area - expected_area) > 0.01:
    results.append((False, "Area calculation check", f"area should be approximately {expected_area:.2f}, got {area:.2f}"))
else:
    results.append((True, "Area calculation check", ""))
```

# Test for Cell 2 (Print numbers)

```python
# Test that the loop ran correctly by checking the output
results = []

# Check if the output contains the expected text
expected_lines = ["Number: 0", "Number: 1", "Number: 2", "Number: 3", "Number: 4"]
output_lines = context['stdout'].strip().split('\n')

# Filter out the greeting and area output from previous cells
relevant_output = [line for line in output_lines if line.startswith("Number:")]

if len(relevant_output) != 5:
    results.append((False, "Loop output check", f"Expected 5 lines with 'Number:', got {len(relevant_output)}"))
else:
    all_match = True
    for i, expected in enumerate(expected_lines):
        if i >= len(relevant_output) or relevant_output[i] != expected:
            all_match = False
            break

    if all_match:
        results.append((True, "Loop output check", ""))
    else:
        results.append((False, "Loop output check", "Output lines don't match expected format"))
```
