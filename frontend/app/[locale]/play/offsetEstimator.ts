export class OffsetEstimator {
  mu: number;
  nu: number;
  alpha: number;
  beta: number;
  p: number; // 平均値の分散
  r: number; // 観測ノイズの分散
  constructor(mu: number, sqrt_p: number, sqrt_r: number, alpha: number) {
    this.mu = mu;
    this.p = sqrt_p ** 2;
    this.r = sqrt_r ** 2;
    this.nu = this.r / this.p;
    this.alpha = alpha;
    this.beta = this.r * (alpha - 1);
  }
  update(ofs: number) {
    const diff = ofs - this.mu;
    const diff_threshold = 1.5 * Math.sqrt(this.p + this.r);
    // this.r = (1 - 0.05) * this.r + 0.05 * diff * diff;
    this.nu += 1;
    this.alpha += 0.5;
    this.beta += (((this.nu - 1) / this.nu) * diff * diff) / 2;
    this.r = this.beta / (this.alpha - 1);
    if (Math.abs(diff) < diff_threshold) {
      const k = this.p / (this.p + this.r);
      this.mu = this.mu + k * diff;
      this.p = (1 - k) * this.p;
    }
    return this.mu;
  }
}
