// This is the interface for all curves in this project.

export class Curve {
    // Parametrics curves, with u from 0 to length. Should give the point C(u)
    evaluate(u){
        return undefined
    }

    // [C(0), C(step), C(2step), ..., C(1-step), C(1)]
    discretization(step) {
        return undefined;
    }

    // Length of the curve
    length(){
        return undefined;
    }
}