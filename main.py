print("Hello from Python in Nexus IDE!")

# This will be executed by Pyodide in the preview
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))