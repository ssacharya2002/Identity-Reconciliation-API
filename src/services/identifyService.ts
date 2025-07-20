import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const identifyContact = async (email?: string, phoneNumber?: string) => {
  const conditions = [];
  if (email) conditions.push({ email });
  if (phoneNumber) conditions.push({ phoneNumber });

  const matched = await prisma.contact.findMany({
    where: {
      OR: conditions,
      deletedAt: null
    },
    orderBy: { createdAt: 'asc' }
  });

  if (!matched.length) {
    const newPrimary = await prisma.contact.create({
      data: { email, phoneNumber, linkPrecedence: 'primary' }
    });
    return {
      primaryContactId: newPrimary.id,
      emails: email ? [email] : [],
      phoneNumbers: phoneNumber ? [phoneNumber] : [],
      secondaryContactIds: []
    };
  }
  // logic for handling existing contacts
  
};
