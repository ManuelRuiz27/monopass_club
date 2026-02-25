import { prisma } from './lib/prisma';

async function main() {
    console.log("Checking users in DB...");
    const users = await prisma.user.findMany({
        select: {
            username: true,
            role: true,
            active: true
        }
    });
    console.log("Users found:", users.length);
    console.log(users);
}

main().catch(console.error).finally(() => process.exit(0));
