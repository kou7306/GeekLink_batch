import prisma from "../config/prisma.js";

export async function resetOnlineUsersService() {
  try {
    const result = await prisma.users.updateMany({
      where: {
        online: true, // onlineがtrueのユーザーのみ対象に
      },
      data: {
        online: false, // onlineをfalseに設定
      },
    });
  } catch (error) {
    console.error("Error setting users offline:", error);
  }
}
