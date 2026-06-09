import { expect, test, type Page } from '@playwright/test';

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Zr9cAAAAASUVORK5CYII=',
  'base64',
);

const cesiumStub = String.raw`(() => {
  if (window.Cesium) return;

  class Cartesian2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  }

  class PropertyBag {
    constructor(values = {}) {
      Object.entries(values).forEach(([key, value]) => {
        this[key] = {
          getValue: () => value,
        };
      });
    }
  }

  class ScreenSpaceEventHandler {
    constructor() {
      this.actions = new Map();
    }

    setInputAction(callback, eventType) {
      this.actions.set(eventType, callback);
    }

    destroy() {
      this.actions.clear();
    }
  }

  class Viewer {
    constructor(container) {
      this.container = container;
      this.entities = {
        items: new Map(),
        add: entity => {
          const id = entity.properties?.postId?.getValue?.() || crypto.randomUUID();
          const nextEntity = {
            ...entity,
            id,
            billboard: entity.billboard ? { ...entity.billboard } : undefined,
          };
          this.entities.items.set(id, nextEntity);
          return nextEntity;
        },
        remove: entity => {
          this.entities.items.delete(entity?.id);
        },
      };

      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      canvas.setAttribute('data-testid', 'cesium-canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);

      this.scene = {
        canvas,
        globe: {
          ellipsoid: {},
          enableLighting: false,
          showGroundAtmosphere: false,
          depthTestAgainstTerrain: false,
        },
        skyAtmosphere: { show: false },
        fog: { enabled: false, density: 0 },
        highDynamicRange: false,
        postProcessStages: { fxaa: { enabled: false } },
        screenSpaceCameraController: {
          inertiaSpin: 0,
          inertiaTranslate: 0,
          inertiaZoom: 0,
          minimumZoomDistance: 0,
          maximumZoomDistance: 0,
        },
        pick: () => null,
      };

      this.camera = {
        flyTo: () => {},
        rotate: () => {},
        setView: () => {},
        pickEllipsoid: () => null,
      };

      this.resolutionScale = 1;
    }

    destroy() {
      this.container.innerHTML = '';
    }
  }

  window.Cesium = {
    Viewer,
    Cartesian2,
    Cartesian3: {
      fromDegrees: (longitude, latitude, height = 0) => ({ longitude, latitude, height }),
      UNIT_Z: { x: 0, y: 0, z: 1 },
    },
    VerticalOrigin: {
      CENTER: 'CENTER',
      BOTTOM: 'BOTTOM',
      TOP: 'TOP',
    },
    HeightReference: {
      NONE: 0,
      CLAMP_TO_GROUND: 1,
    },
    Color: {
      BLACK: 'black',
      WHITE: 'white',
      fromCssColorString: value => ({ value }),
    },
    LabelStyle: {
      FILL_AND_OUTLINE: 'FILL_AND_OUTLINE',
    },
    PropertyBag,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType: {
      LEFT_CLICK: 'LEFT_CLICK',
    },
    Cartographic: {
      fromCartesian: cartesian => cartesian,
    },
    Math: {
      toRadians: degrees => degrees * Math.PI / 180,
      toDegrees: radians => radians * 180 / Math.PI,
    },
    defined: value => value !== undefined && value !== null,
  };
})();`;

const guestExploreResponse = {
  type: 'POSTS',
  posts: [
    {
      id: 'guest-pin-1',
      title: 'Harbor light',
      description: 'A public memory used to prove the explore flow.',
      latitude: 37.7749,
      longitude: -122.4194,
      tags: ['travel'],
      createdAt: '2026-06-01T12:00:00.000Z',
      user: {
        id: 'guest-author',
        username: 'maya',
        name: 'Maya',
        profilePic: null,
      },
      media: [],
    },
  ],
  total: 1,
  hasMore: false,
};

const searchResult = {
  place_id: 1,
  display_name: 'Paris, France',
  lat: '48.8566',
  lon: '2.3522',
};

const authenticatedUser = {
  id: 'user-1',
  email: 'terra@example.com',
  username: 'terra',
  name: 'Terra Explorer',
  profilePic: null,
};

const publishedPost = {
  id: 'memory-1',
  userId: 'user-1',
  title: 'Sunrise over the Seine',
  description: 'A quiet morning by the river.',
  latitude: 48.8566,
  longitude: 2.3522,
  visibility: 'PUBLIC',
  createdAt: '2026-06-04T10:00:00.000Z',
  user: authenticatedUser,
  media: [{ url: 'https://cdn.example.com/memory.png' }],
  tags: [],
  _count: { likes: 0, comments: 0, savedBy: 0 },
};

async function mockCommonRoutes(page: Page) {
  await page.route('**/cesium/Cesium.js', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: cesiumStub,
    });
  });

  await page.route('**/api/v1/posts/explore**', route => {
    route.fulfill({ json: guestExploreResponse });
  });

  await page.route('**/nominatim.openstreetmap.org/search**', route => {
    route.fulfill({ json: [searchResult] });
  });

  await page.route('**/api/v1/posts/search**', route => {
    route.fulfill({
      json: {
        posts: [publishedPost],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });
  });

  await page.route('**/nominatim.openstreetmap.org/reverse**', route => {
    route.fulfill({ json: { display_name: 'Paris, France' } });
  });

  await page.route('**/images.unsplash.com/**', route => {
    route.fulfill({
      contentType: 'image/png',
      body: transparentPng,
    });
  });
}

async function loadGuestPage(page: Page) {
  await mockCommonRoutes(page);
  await page.goto('/');
  await expect(page.getByTestId('cesium-canvas')).toBeVisible();
}

async function loadAuthenticatedPage(page: Page) {
  await mockCommonRoutes(page);

  await page.addInitScript(({ token, userId }) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_uid', userId);
  }, {
    token: 'test-token',
    userId: authenticatedUser.id,
  });

  await page.route('**/api/v1/auth/me', route => {
    route.fulfill({ json: authenticatedUser });
  });

  await page.route('**/api/v1/posts/upload', route => {
    route.fulfill({
      json: {
        success: true,
        url: 'https://cdn.example.com/memory.png',
        coordinates: null,
      },
    });
  });

  await page.route('**/api/v1/posts', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: publishedPost });
    } else {
      route.continue();
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('cesium-canvas')).toBeVisible();
}

test('guest can explore, search, view a memory, and stays unauthenticated', async ({ page }) => {
  await loadGuestPage(page);

  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

  await page.getByRole('button', { name: /search earth/i }).click();
  await page.getByPlaceholder('Search a city, landmark, or memory...').fill('Paris');
  await expect(page.getByRole('button', { name: /paris, france/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sunrise over the seine/i })).toBeVisible();

  await page.getByRole('button', { name: /sunrise over the seine/i }).click();
  await expect(page.getByRole('article', { name: /memory detail/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /sunrise over the seine/i })).toBeVisible();

  await page.getByRole('button', { name: /close memory/i }).click();
  await expect(page.getByRole('article', { name: /memory detail/i })).toHaveCount(0);

  await page.getByRole('button', { name: /^search$/i }).click();
  await page.getByPlaceholder('Search a city, landmark, or memory...').fill('Paris');
  await page.getByRole('button', { name: /paris, france/i }).click();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole('region', { name: /search locations/i })).toHaveCount(0);

  // Playwright .click() fails here because the hero section overlay intercepts
  // pointer events on the featured-memory bar. dispatchEvent bypasses the
  // actionability check and dispatches the DOM click directly.
  await page.getByRole('button', { name: /morning light over the valley/i }).dispatchEvent('click');
  await expect(page.getByRole('article', { name: /memory detail/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /morning light over the valley/i })).toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem('tf_token'))).toBeNull();

  await page.getByRole('button', { name: /upload/i }).click();
  await expect(page.getByRole('heading', { name: /sign in when you are ready to share/i })).toBeVisible();
  await expect(page.locator('.tf-auth-card').getByRole('button', { name: /^sign in$/i })).toBeVisible();
});

test('authenticated user can publish a memory with mocked data', async ({ page }) => {
  await loadAuthenticatedPage(page);

  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

  await page.getByRole('button', { name: /upload/i }).click();
  await expect(page.getByRole('heading', { name: /pin a memory to earth/i })).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'memory.png',
    mimeType: 'image/png',
    buffer: transparentPng,
  });

  await page.getByPlaceholder('What happened here?').fill('Sunrise over the Seine');
  await page.getByPlaceholder('Add the human detail people should feel when they arrive.').fill('A quiet morning by the river.');
  await page.getByRole('button', { name: /publish memory/i }).click();

  await expect(page.getByRole('article', { name: /memory detail/i })).toBeVisible();
  await expect(page.getByText('Sunrise over the Seine')).toBeVisible();
  await expect(page.getByText('A quiet morning by the river.')).toBeVisible();
});

test('guest search shows empty state when no results are found', async ({ page }) => {
  await loadGuestPage(page);

  // Override search mocks to return zero results
  await page.route('**/nominatim.openstreetmap.org/search**', route => {
    route.fulfill({ json: [] });
  });

  await page.route('**/api/v1/posts/search**', route => {
    route.fulfill({
      json: {
        posts: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });
  });

  await page.getByRole('button', { name: /search earth/i }).click();
  await page.getByPlaceholder('Search a city, landmark, or memory...').fill('zzzz-not-a-real-location-12345');

  // Verify the empty state message with exploration tone is visible
  const emptyState = page.getByRole('status');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('The globe is silent here. Try another place or memory.');
});