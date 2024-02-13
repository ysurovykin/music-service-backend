export class NotFoundError extends Error {
    status: number;

    constructor(message: string) {
        super(message);
        this.status = 404;
    }
}

export class ForbiddenError extends Error {
    status: number;

    constructor(message: string) {
        super(message);
        this.status = 403;
    }
}

export class UnauthorizedError extends Error {
    status: number;

    constructor() {
        super('User is not authorized');
        this.status = 401;
    }
}

export class ValidationError extends Error {
    status: number;

    constructor(message: string) {
        super(message);
        this.status = 400;
    }
}
