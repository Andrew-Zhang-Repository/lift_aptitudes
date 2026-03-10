export function one_rep_max(weight: number, rep_count: number): number {

    if (rep_count === 1){
        return weight
    }

    if (rep_count === 0 || weight <= 0 ){
        return 0 
    }

    return weight * (1 + (rep_count/30));
}