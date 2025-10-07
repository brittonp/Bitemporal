import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the ContentManager module before importing main.mjs
vi.mock('../ContentManager.mjs', () => {
  return {
    ContentManager: vi.fn().mockImplementation(() => ({
      addContent: vi.fn()
    })),
  };
});

// Now import main.mjs (this will use the mocked ContentManager)
import '../main.mjs';

// Import the mocked ContentManager directly from the mock cache
import { ContentManager } from '../ContentManager.mjs';

describe('main.mjs', () => {
  let container;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'container';
    document.body.innerHTML = '';
    document.body.appendChild(container);

    // Reset mock call counts before each test
    ContentManager.mockClear();
  });

  it('should initialize ContentManager and add content on window load', async () => {
    // Dispatch the load event to trigger your listener
    window.dispatchEvent(new Event('load'));

    // Wait a tick so async handlers complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert the ContentManager constructor was called with container
    expect(ContentManager).toHaveBeenCalledWith(container);

    // Grab the instance created by the mock constructor
    const instance = ContentManager.mock.results[0].value;

    // Assert addContent was called 10 times with expected args
    expect(instance.addContent).toHaveBeenCalledTimes(10);
    expect(instance.addContent).toHaveBeenCalledWith('1');
  });
});
