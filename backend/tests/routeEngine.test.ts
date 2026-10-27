import test from 'node:test';
import assert from 'node:assert';
import {
  routeEngineService,
  calculateDistanceKm,
  formatMinutes,
} from '../src/services/routeEngine.service';
import { FLEET } from '../src/data/mockData';

test('Route Engine — Direct Route Generation', () => {
  const route = routeEngineService.buildOrderedRoute({
    origin: 'BOM',
    destination: 'LHR',
    aircraftId: 'e195-e2',
  });

  assert.strictEqual(route.stops.length, 2);
  assert.strictEqual(route.stops[0].code, 'BOM');
  assert.strictEqual(route.stops[0].role, 'ORIGIN');
  assert.strictEqual(route.stops[1].code, 'LHR');
  assert.strictEqual(route.stops[1].role, 'DESTINATION');

  // Exactly 1 leg for direct flight
  assert.strictEqual(route.legs.length, 1);
  assert.strictEqual(route.legs[0].from.code, 'BOM');
  assert.strictEqual(route.legs[0].to.code, 'LHR');
  assert.ok(route.legs[0].distanceKm > 6000);
  assert.ok(route.legs[0].durationMinutes > 0);
});

test('Route Engine — Single Stopover (Mumbai -> Delhi -> Kolkata)', () => {
  const route = routeEngineService.buildOrderedRoute({
    origin: 'BOM',
    stopovers: ['DEL'],
    destination: 'CCU',
    aircraftId: 'e195-e2',
  });

  // Exactly 3 stops: BOM, DEL, CCU
  assert.strictEqual(route.stops.length, 3);
  assert.deepStrictEqual(
    route.stops.map(s => s.code),
    ['BOM', 'DEL', 'CCU']
  );

  // Exactly 2 consecutive legs: BOM -> DEL, DEL -> CCU
  assert.strictEqual(route.legs.length, 2);
  assert.strictEqual(route.legs[0].from.code, 'BOM');
  assert.strictEqual(route.legs[0].to.code, 'DEL');
  assert.strictEqual(route.legs[1].from.code, 'DEL');
  assert.strictEqual(route.legs[1].to.code, 'CCU');

  // Verify next leg begins exactly at the previous leg's destination
  assert.strictEqual(route.legs[1].from.lat, route.legs[0].to.lat);
  assert.strictEqual(route.legs[1].from.lng, route.legs[0].to.lng);
});

test('Route Engine — Multiple Stopovers in Canonical Sequence', () => {
  const route = routeEngineService.buildOrderedRoute({
    origin: 'BOM',
    stopovers: ['DXB', 'LHR'],
    destination: 'JFK',
    aircraftId: 'a350-900',
  });

  // 4 stops: BOM -> DXB -> LHR -> JFK
  assert.strictEqual(route.stops.length, 4);
  assert.deepStrictEqual(
    route.stops.map(s => s.code),
    ['BOM', 'DXB', 'LHR', 'JFK']
  );

  // 3 consecutive legs
  assert.strictEqual(route.legs.length, 3);
  assert.strictEqual(route.legs[0].from.code, 'BOM');
  assert.strictEqual(route.legs[0].to.code, 'DXB');
  assert.strictEqual(route.legs[1].from.code, 'DXB');
  assert.strictEqual(route.legs[1].to.code, 'LHR');
  assert.strictEqual(route.legs[2].from.code, 'LHR');
  assert.strictEqual(route.legs[2].to.code, 'JFK');

  // Total distance equals sum of leg distances
  const expectedTotalDistance =
    route.legs[0].distanceKm + route.legs[1].distanceKm + route.legs[2].distanceKm;
  assert.strictEqual(route.totalDistanceKm, expectedTotalDistance);
});

test('Route Engine — Reordering Stopovers Changes Leg Sequence', () => {
  const route1 = routeEngineService.buildOrderedRoute({
    origin: 'BOM',
    stopovers: ['DEL', 'DXB'],
    destination: 'LHR',
  });

  const route2 = routeEngineService.buildOrderedRoute({
    origin: 'BOM',
    stopovers: ['DXB', 'DEL'],
    destination: 'LHR',
  });

  assert.strictEqual(route1.legs[0].to.code, 'DEL');
  assert.strictEqual(route2.legs[0].to.code, 'DXB');
  assert.notStrictEqual(route1.totalDistanceKm, route2.totalDistanceKm);
});

test('Route Engine — Consecutive Duplicate Airports Rejected', () => {
  assert.throws(
    () => {
      routeEngineService.buildOrderedRoute({
        origin: 'BOM',
        stopovers: ['BOM'],
        destination: 'DEL',
      });
    },
    /CONSECUTIVE_DUPLICATES/
  );

  assert.throws(
    () => {
      routeEngineService.buildOrderedRoute({
        origin: 'BOM',
        stopovers: ['DEL', 'DEL'],
        destination: 'LHR',
      });
    },
    /CONSECUTIVE_DUPLICATES/
  );
});

test('Route Engine — Invalid Airport Code Rejected', () => {
  assert.throws(
    () => {
      routeEngineService.buildOrderedRoute({
        origin: 'XYZ999',
        destination: 'DEL',
      });
    },
    /INVALID_AIRPORT/
  );
});

test('Route Engine — Three Selectable Aircraft Support', () => {
  const targetAircraftIds = ['g650er', 'a350-900', 'e195-e2'];

  for (const id of targetAircraftIds) {
    const aircraft = routeEngineService.getAircraft(id);
    assert.ok(aircraft, `Aircraft ${id} must exist in fleet`);
    assert.strictEqual(aircraft.id, id);

    // Test route calculation with each aircraft
    const route = routeEngineService.buildOrderedRoute({
      origin: 'BOM',
      stopovers: ['DXB'],
      destination: 'LHR',
      aircraftId: id,
    });

    assert.strictEqual(route.aircraftId, id);
    assert.strictEqual(route.aircraft.model, aircraft.model);
    assert.ok(route.totalDurationMinutes > 0);
  }
});

test('Route Engine — Nonexistent Aircraft ID Rejected', () => {
  assert.throws(
    () => {
      routeEngineService.buildOrderedRoute({
        origin: 'BOM',
        destination: 'DEL',
        aircraftId: 'spaceship-one',
      });
    },
    /INVALID_AIRCRAFT/
  );
});

test('Route Engine — Persistence and Retrieval by ID', () => {
  const created = routeEngineService.buildOrderedRoute({
    origin: 'SIN',
    stopovers: ['HND'],
    destination: 'SYD',
    aircraftId: 'a350-900',
  });

  const retrieved = routeEngineService.getRouteById(created.id);
  assert.ok(retrieved);
  assert.strictEqual(retrieved?.id, created.id);
  assert.deepStrictEqual(
    retrieved?.stops.map(s => s.code),
    ['SIN', 'HND', 'SYD']
  );
});

test('Route Engine — Great Circle Distance Helper', () => {
  // Mumbai (19.0896, 72.8679) to Delhi (28.5562, 77.1) ~ 1148 km
  const dist = calculateDistanceKm(19.0896, 72.8679, 28.5562, 77.1);
  assert.ok(dist >= 1100 && dist <= 1200, `Distance should be ~1148 km, got ${dist}`);
});
