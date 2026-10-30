// Post-processing only: no constitutive model or extrapolation of a test curve.
export function parseCompressionCSV(text) {
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines.length<3||lines[0].split(',').map(x=>x.trim()).join(',')!=='u_mm,F_N')throw Error('CSV 表头必须为 u_mm,F_N，并至少包含两行数据。');
 return lines.slice(1).map((line,i)=>{const c=line.split(',').map(x=>x.trim());if(c.length!==2||c.some(x=>!x)||c.some(x=>!Number.isFinite(Number(x))))throw Error(`第 ${i+2} 行必须为两个数字：位移 mm, 力 N。`);return {u:Number(c[0]),f:Number(c[1])}});
}
export function compressionMetrics(points, options){
 if(!Array.isArray(points)||points.length<2)throw Error('至少需要两个力–位移数据点。');
 for(let i=0;i<points.length;i++){const p=points[i];if(!Number.isFinite(p.u)||!Number.isFinite(p.f)||p.u<0||p.f<0)throw Error('位移与压力须为非负有限数值。');if(i&&p.u<=points[i-1].u)throw Error('位移必须严格递增；请先处理重复值、卸载或循环段。');}
 if(points[0].u!==0)throw Error('首个位移必须是 0 mm；请先完成接触点与零点校正。');
 const {widthMm,depthMm,heightMm,massG,solidDensity,cutoffMm,elasticStart,elasticEnd,plateauStart,plateauEnd}=options;
 for(const [k,v] of Object.entries({widthMm,depthMm,heightMm,massG}))if(!Number.isFinite(v)||v<=0)throw Error(`${k} 必须为正数。`);
 if(solidDensity!=null&&(!Number.isFinite(solidDensity)||solidDensity<=0))throw Error('基体密度必须为正数。');
 const end=cutoffMm??points.at(-1).u;
 if(!Number.isFinite(end)||end<=0||end>points.at(-1).u)throw Error('截断位移必须大于 0 且不超过最后测点。');
 function forceAt(u){if(u<0||u>points.at(-1).u)throw Error('应变区间超出曲线数据。');let lo=0,hi=points.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(points[mid].u<=u)lo=mid;else hi=mid;}if(u===points[hi].u)return points[hi].f;const a=points[lo],b=points[hi];return a.f+(b.f-a.f)*(u-a.u)/(b.u-a.u);}
 function integral(a,b){const segment=[{u:a,f:forceAt(a)},...points.filter(p=>p.u>a&&p.u<b),{u:b,f:forceAt(b)}];let area=0;for(let i=1;i<segment.length;i++)area+=(segment[i].u-segment[i-1].u)*(segment[i].f+segment[i-1].f)/2;return area;}
 function window(a,b,label){if(a==null&&b==null)return null;if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||b*heightMm>end+1e-10)throw Error(`${label}需填写完整且递增的工程应变区间，并在截断位移以内。`);return [a*heightMm,b*heightMm];}
 const area=widthMm*depthMm,volume=area*heightMm/1000,rho=massG/volume,energyNmm=integral(0,end),energyJ=energyNmm/1000;
 let peak=forceAt(end);for(const p of points){if(p.u>end)break;peak=Math.max(peak,p.f);}
 const elastic=window(elasticStart,elasticEnd,'刚度区间'), plateau=window(plateauStart,plateauEnd,'平台区间');
 const E=elastic?(forceAt(elastic[1])-forceAt(elastic[0]))/area/((elastic[1]-elastic[0])/heightMm):null;
 const mean=energyNmm/end;
 return {geometry:{widthMm,depthMm,heightMm,areaMm2:area,volumeCm3:volume,massG,solidDensityGcm3:solidDensity??null},analysis:{cutoffMm:end,cutoffStrain:end/heightMm,elasticStrainWindow:elastic?[elasticStart,elasticEnd]:null,plateauStrainWindow:plateau?[plateauStart,plateauEnd]:null,pointCount:points.length},metrics:{effectiveDensityGcm3:rho,relativeDensity:solidDensity==null?null:rho/solidDensity,youngChordMPa:E,specificStiffness:E==null?null:E/rho,peakForceN:peak,peakStressMPa:peak/area,specificPeakStrength:(peak/area)/rho,absorbedEnergyJ:energyJ,SEA_J_g:energyJ/massG,meanForceN:mean,CFE:peak>0?mean/peak:null,plateauStressMPa:plateau?integral(...plateau)/(plateau[1]-plateau[0])/area:null},warnings:['压缩数据和尺寸由用户提供；非 FE 预测。','等效刚度是指定区间割线，不保证为初始弹性模量。','峰值与 CFE 只针对指定截断位移，非材料极限强度。',...(solidDensity!=null&&rho>solidDensity?['有效密度高于基体密度；请检查质量、尺寸、单位或密度基准。']:[])]};
}
