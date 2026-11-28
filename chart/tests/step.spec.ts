import { describe, test } from "node:test";
import { expect } from "chai";
import { stepSimplify } from "../src/step.js";

describe("stepSimplify", () => {
  test("should simplify fractions and carry into fourth", () => {
    expect(
      stepSimplify({ fourth: 1, numerator: 6, denominator: 4 })
    ).to.deep.equal({
      fourth: 2,
      numerator: 1,
      denominator: 2,
    });
    expect(
      stepSimplify({ fourth: 3, numerator: 0, denominator: 8 })
    ).to.deep.equal({
      fourth: 3,
      numerator: 0,
      denominator: 1,
    });
  });

  test("should simplify huge denominators quickly", () => {
    const start = performance.now();
    const res1 = stepSimplify({
      fourth: 0,
      numerator: 1_000_000_006,
      denominator: 1_000_000_007,
    });
    const res2 = stepSimplify({
      fourth: 0,
      numerator: 500_000_000,
      denominator: 1_000_000_000,
    });
    const elapsedMs = performance.now() - start;

    expect(res1).to.deep.equal({
      fourth: 0,
      numerator: 1_000_000_006,
      denominator: 1_000_000_007,
    });
    expect(res2).to.deep.equal({
      fourth: 0,
      numerator: 1,
      denominator: 2,
    });
    expect(elapsedMs).to.be.below(100);
  });
});
