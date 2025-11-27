from leann.api import get_registered_backends

backends = get_registered_backends()
print("Available Leann backends:")
for b in backends:
    print("-", b)
