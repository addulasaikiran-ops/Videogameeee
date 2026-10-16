export class DayNightCycle {
  constructor(scene, light) { this.scene=scene; this.light=light; this.time=0; }
  update(delta) { this.time=(this.time+delta*0.01)%1; this.light.intensity=1.2+0.5+0.5*Math.sin(this.time*Math.PI*2); }
}
