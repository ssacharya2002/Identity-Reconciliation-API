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

  const roots = new Set<number>();
  for (const contact of matched) {
    let curr = contact;
    while (curr.linkPrecedence === 'secondary' && curr.linkedId) {
      curr = await prisma.contact.findUniqueOrThrow({ where: { id: curr.linkedId } });
    }
    roots.add(curr.id);
  }

  const related = await prisma.contact.findMany({
    where: {
      OR: Array.from(roots).map(id => ({
        OR: [{ id }, { linkedId: id }]
      })),
      deletedAt: null
    },
    orderBy: { createdAt: 'asc' }
  });

  const primary = related.find(c => c.linkPrecedence === 'primary')!;
  for (const rootId of roots) {
    if (rootId !== primary.id) {
      await prisma.contact.updateMany({
        where: {
          OR: [{ id: rootId }, { linkedId: rootId }]
        },
        data: {
          linkedId: primary.id,
          linkPrecedence: 'secondary'
        }
      });
    }
  }

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [{ id: primary.id }, { linkedId: primary.id }],
      deletedAt: null
    },
    orderBy: { createdAt: 'asc' }
  });

  const emailSet = new Set(contacts.map(c => c.email).filter(Boolean));
  const phoneSet = new Set(contacts.map(c => c.phoneNumber).filter(Boolean));

  if ((email && !emailSet.has(email)) || (phoneNumber && !phoneSet.has(phoneNumber))) {
    const newSecondary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primary.id,
        linkPrecedence: 'secondary'
      }
    });
    contacts.push(newSecondary);
    if (email) emailSet.add(email);
    if (phoneNumber) phoneSet.add(phoneNumber);
  }

  return {
    primaryContactId: primary.id,
    emails: Array.from(emailSet),
    phoneNumbers: Array.from(phoneSet),
    secondaryContactIds: contacts.filter(c => c.linkPrecedence === 'secondary').map(c => c.id)
  };
};
