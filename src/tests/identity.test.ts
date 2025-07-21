import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/identify', () => {
  beforeEach(async () => {
    // Clear contacts before each test
    await prisma.contact.deleteMany();
    
  });

  afterAll(async () => {
    // disconnect Prisma after tests
    await prisma.$disconnect();
  });


  it('should return 400 when both email and phone number are missing', async () => {
    const res = await request(app).post('/api/identify').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'invalid-email', phoneNumber: '123456' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid email format.');
  });

  it('should return 400 for invalid phone number format', async () => {
    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'valid@email.com', phoneNumber: '12ab56' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid phoneNumber format. Only digits are allowed.');
  });
  it('should create a new primary contact when no match is found', async () => {
    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'doc@flux.com', phoneNumber: '111111' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact).toMatchObject({
      emails: ['doc@flux.com'],
      phoneNumbers: ['111111'],
      secondaryContactIds: [],
    });
    expect(res.body.contact.primaryContactId).toBeDefined();
  });

  it('should add new phone number as a secondary contact if email matches', async () => {
    // Create the primary contact
    await request(app).post('/api/identify').send({ email: 'doc@flux.com', phoneNumber: '111111' });

    // Add a new phone for the same email
    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'doc@flux.com', phoneNumber: '222222' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.phoneNumbers).toEqual(expect.arrayContaining(['111111', '222222']));
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should add new email as a secondary contact if phone number matches', async () => {
    await request(app).post('/api/identify').send({ email: 'doc@flux.com', phoneNumber: '111111' });

    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'emmett@brown.com', phoneNumber: '111111' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toEqual(expect.arrayContaining(['doc@flux.com', 'emmett@brown.com']));
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should merge two separate primaries if email and phone connect them', async () => {
    const res1 = await request(app)
      .post('/api/identify')
      .send({ email: 'george@hillvalley.edu', phoneNumber: '919191' });

    await request(app)
      .post('/api/identify')
      .send({ email: 'biffsucks@hillvalley.edu', phoneNumber: '717171' });

    const res = await request(app)
      .post('/api/identify')
      .send({ email: 'george@hillvalley.edu', phoneNumber: '717171' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toEqual(
      expect.arrayContaining(['george@hillvalley.edu', 'biffsucks@hillvalley.edu'])
    );
    expect(res.body.contact.phoneNumbers).toEqual(expect.arrayContaining(['919191', '717171']));
    expect(res.body.contact.primaryContactId).toBe(res1.body.contact.primaryContactId);
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should return merged data if only email matches an existing contact group', async () => {
    await request(app).post('/api/identify').send({ email: 'lorraine@hillvalley.edu', phoneNumber: '123456' });
    await request(app).post('/api/identify').send({ email: 'mcfly@hillvalley.edu', phoneNumber: '123456' });

    const res = await request(app).post('/api/identify').send({ email: 'mcfly@hillvalley.edu' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toEqual(
      expect.arrayContaining(['lorraine@hillvalley.edu', 'mcfly@hillvalley.edu'])
    );
    expect(res.body.contact.phoneNumbers).toContain('123456');
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should return merged data if only phone number matches an existing group', async () => {
    await request(app).post('/api/identify').send({ email: 'lorraine@hillvalley.edu', phoneNumber: '123456' });
    await request(app).post('/api/identify').send({ email: 'mcfly@hillvalley.edu', phoneNumber: '123456' });

    const res = await request(app).post('/api/identify').send({ phoneNumber: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toEqual(
      expect.arrayContaining(['lorraine@hillvalley.edu', 'mcfly@hillvalley.edu'])
    );
    expect(res.body.contact.phoneNumbers).toContain('123456');
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should return merged data if both email and phone match the same group', async () => {
    await request(app).post('/api/identify').send({ email: 'lorraine@hillvalley.edu', phoneNumber: '123456' });
    await request(app).post('/api/identify').send({ email: 'mcfly@hillvalley.edu', phoneNumber: '123456' });

    const res = await request(app).post('/api/identify').send({
      email: 'mcfly@hillvalley.edu',
      phoneNumber: '123456',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toEqual(
      expect.arrayContaining(['lorraine@hillvalley.edu', 'mcfly@hillvalley.edu'])
    );
    expect(res.body.contact.phoneNumbers).toContain('123456');
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });
});
