// Fixed-cell periodic pin-jointed axial-bar framework: rigorous count bounds.
// This does not model bending, prestress, rigid joints or a deformable cell.
export function rigidityBound(model,{excludeBoundaryWebs=false}={}) {
 const edges=model.edges.filter(e=>!(excludeBoundaryWebs&&e.role==='boundary-web'));
 const degree=Array(model.vertices.length).fill(0);
 for(const e of edges){degree[e.a]++;degree[e.b]++;}
 const histogram={};
 for(const d of degree)histogram[d]=(histogram[d]||0)+1;
 const V=degree.length,E=edges.length;
 // 3V unknowns, at most E independent axial constraints; remove 3 translations.
 const maxwellLowerBound=Math.max(0,3*V-E-3);
 // Disjoint degree <=2 node displacement subspaces are independently floppy.
 // This bound ignores up to three global translations, conservatively.
 const localRaw=degree.reduce((a,d)=>a+Math.max(0,3-d),0);
 const localLowerBound=Math.max(0,localRaw-3);
 return {V,E,histogram,degreeTwo:histogram[2]||0,maxwellLowerBound,localLowerBound,
  explanation:'Fixed lattice, point joints, axial bars only. Lower bounds on non-translational infinitesimal mechanisms; not a stiffness rank computation.'};
}
