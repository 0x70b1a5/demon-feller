
const roll = (a: { type: any, weight: number }[]) => {
  let totalWeight = a.reduce((sum, el) => sum + el.weight, 0);
  
  let randomNum = Math.random() * totalWeight;
  
  let weightSum = 0;
  for (let el of a) {
    weightSum += el.weight;
    
    if (randomNum <= weightSum) {
      return el.type
    }
  }

  return a[0].type
}

export default roll