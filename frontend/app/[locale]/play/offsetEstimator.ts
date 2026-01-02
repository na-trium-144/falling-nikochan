export class OffsetEstimator {
  // 正規-逆ガンマ分布による推定器
  mu: number; // 平均値の初期推定
  nu = 15; // 初期推定への確信度（「何個分のデータの重みがあるか」）
  alpha = 15 / 2; // ノイズ分散の形状パラメータ（通常は「想定データ数/2」）
  beta = (0.08 ** 2 * 15) / 2; // ノイズ分散の尺度パラメータ（通常は「想定分散 * alpha」）
  constructor(mu: number) {
    this.mu = mu;
  }
  update(ofs: number) {
    const mu_old = this.mu;
    const nu_old = this.nu;
    this.nu += 1;
    this.alpha += 0.5;
    this.mu = (nu_old * mu_old + ofs) / this.nu;
    this.beta = this.beta + (nu_old / this.nu) * (ofs - mu_old) ** 2 * 0.5;
    console.log("μ, ν, α, β =", this.mu, this.nu, this.alpha, this.beta);
    return this.mu;
  }
}
