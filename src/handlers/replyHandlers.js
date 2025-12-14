const appealService = require('../services/appealService');
const aiService = require('../services/aiService');
const { TelegramGroup } = require('../models');
const i18next = require('../config/i18n');

/**
 * Reply Handlers
 * Handles replies to bot messages in groups (admin responses to appeals)
 */
class ReplyHandlers {
  /**
   * Handle reply to bot message in group
   */
  async handleReply(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const replyToMessageId = msg.reply_to_message.message_id;

    // Check if message is from a group
    if (msg.chat.type === 'private') {
      return; // Not a group reply
    }

    // Check if user is admin
    try {
      const chatMember = await bot.getChatMember(chatId, userId);
      if (chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
        return; // Not an admin, ignore
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      return;
    }

    // Find appeal by group message ID
    const appeal = await appealService.getAppealByGroupMessageId(replyToMessageId);
    if (!appeal) {
      return; // Not an appeal message
    }

    // Get user language
    const { User } = require('../models');
    const user = await User.findOne({ where: { telegramId: appeal.userId } });
    const language = user?.language || 'uz';
    i18next.changeLanguage(language);

    // Format response using AI
    const responseText = await this.formatResponse(msg.text, appeal, language);

    // Send to citizen
    try {
      await bot.sendMessage(
        appeal.userId,
        `📨 Sizning murojaatingizga javob:\n\n${responseText}\n\n` +
        `📌 Murojaat ID: ${appeal.appealId}`
      );
    } catch (error) {
      console.error('Error sending reply to citizen:', error);
      // If user blocked bot, notify admin
      await bot.sendMessage(chatId, 
        '⚠️ Fuqaroga javob yuborib bo\'lmadi. Ehtimol, fuqaro botni bloklagan.'
      );
    }
  }

  /**
   * Format admin response using AI
   */
  async formatResponse(adminResponse, appeal, language) {
    try {
      const prompt = `Quyidagi murojaatga berilgan javobni rasmiy, tushunarli va fuqaroga mos formatda qayta yozing:

Murojaat:
"${appeal.appealText}"

Admin javobi:
"${adminResponse}"

Faqat rasmiy javobni qaytaring, boshqa izoh qo'shmang.`;

      const formatted = await aiService.generateResponse(prompt, 'gpt-4o-mini');
      return formatted.trim();
    } catch (error) {
      console.error('Error formatting response:', error);
      return adminResponse; // Return original on error
    }
  }
}

module.exports = new ReplyHandlers();

