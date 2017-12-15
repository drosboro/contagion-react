export function random_standard_normal() {
  return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
}

export function random_normal(mean, stdev) {
  return Math.round(random_standard_normal()*stdev+mean);
}