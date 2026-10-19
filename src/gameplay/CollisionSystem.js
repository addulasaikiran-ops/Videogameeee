// AABB collision between the player and platform list. Resolution is axis-
// separated: vertical first (ground/ceiling), then horizontal (walls).
// Platforms expose { minX, maxX, topY, bottomY, deltaX } via their `aabb`.

export function resolvePlayerCollisions(player, platforms, dt) {
  const p = player;
  const halfW = p.width / 2;
  const prevBottom = p.prevY;
  const prevTop = p.prevY + p.height;

  let grounded = false;
  let groundPlatform = null;

  // --- Vertical pass ---
  for (const plat of platforms) {
    const a = plat.aabb;
    const overlapX = p.position.x + halfW > a.minX && p.position.x - halfW < a.maxX;
    if (!overlapX) continue;
    const bottom = p.position.y;
    const top = p.position.y + p.height;
    // Landing: was above the platform top last frame, now crossing it.
    if (p.velocity.y <= 0 && prevBottom >= a.topY - 0.001 && bottom <= a.topY) {
      p.position.y = a.topY;
      p.velocity.y = 0;
      grounded = true;
      groundPlatform = plat;
    } else if (p.velocity.y > 0 && prevTop <= a.bottomY + 0.001 && top >= a.bottomY) {
      p.position.y = a.bottomY - p.height;
      p.velocity.y = 0;
    }
  }

  // --- Horizontal pass ---
  for (const plat of platforms) {
    const a = plat.aabb;
    const overlapY = p.position.y + p.height > a.bottomY + 0.001 && p.position.y < a.topY - 0.001;
    if (!overlapY) continue;
    const right = p.position.x + halfW;
    const left = p.position.x - halfW;
    if (right > a.minX && left < a.minX && p.velocity.x > 0) {
      p.position.x = a.minX - halfW;
      p.velocity.x = 0;
    } else if (left < a.maxX && right > a.maxX && p.velocity.x < 0) {
      p.position.x = a.maxX + halfW;
      p.velocity.x = 0;
    }
  }

  return { grounded, groundPlatform };
}

export function aabbOverlap(ax, ay, aw, ah, b) {
  return ax + aw > b.minX && ax < b.maxX && ay + ah > b.bottomY && ay < b.topY;
}
