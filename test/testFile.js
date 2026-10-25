
const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');

describe('Dog Adoption API', function () {
    describe('POST /signup', function () {
        it('rejects a request with missing credentials', async function () {
            const res = await request(app)
                .post('/signup')
                .send({});

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error');
        });
    });

    describe('POST /login', function () {
        it('rejects missing credentials', async function () {
            const res = await request(app)
                .post('/login')
                .send({});

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error');
        });
    });

    describe('POST /dogs', function () {
        it('rejects requests without authentication', async function () {
            const res = await request(app)
                .post('/dogs')
                .send({
                    name: 'Buddy',
                    description: 'A friendly dog'
                });

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error');
        });
    });

    describe('GET /dogs/mine', function () {
        it('rejects requests without authentication', async function () {
            const res = await request(app)
                .get('/dogs/mine');

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error');
        });
    });

    describe('GET /dogs/adopted', function () {
        it('rejects requests without authentication', async function () {
            const res = await request(app)
                .get('/dogs/adopted');

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error');
        });
    });
});

