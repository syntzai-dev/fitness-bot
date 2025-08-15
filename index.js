const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Твой TOKEN от @BotFather (замени на свой!)
const BOT_TOKEN = '7734643977:AAEOCHvQdzI_dW7MCyolUrB_lLri3t6HZgE';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Функция отправки сообщения
async function sendMessage(chatId, text, options = {}) {
  try {
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      ...options
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error.response?.data || error.message);
  }
}

// Функция отправки сообщения с кнопками
async function sendMessageWithButtons(chatId, text, buttons) {
  const keyboard = {
    inline_keyboard: buttons.map(row => 
      row.map(btn => ({
        text: btn.text,
        callback_data: btn.callback || btn.text
      }))
    )
  };
  
  await sendMessage(chatId, text, { reply_markup: keyboard });
}

// Калькулятор калорий
function calculateCalories(weight, height, age, gender, activity) {
  let bmr;
  
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  const dailyCalories = Math.round(bmr * activityMultipliers[activity]);
  return { bmr: Math.round(bmr), daily: dailyCalories };
}

// Обработка команд
function handleCommand(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const firstName = message.from.first_name || 'Друг';

  switch (text) {
    case '/start':
      const welcomeText = `🏋️ Привет, ${firstName}! Я FitnessHelper Bot!

Я помогу тебе:
💪 Считать калории
📊 Отслеживать тренировки  
🎯 Достигать фитнес-целей

Напиши /help для списка команд`;
      
      sendMessage(chatId, welcomeText);
      break;

    case '/help':
      const helpButtons = [
        [{ text: '💪 Калории', callback: 'calories' }],
        [{ text: '📊 Тренировка', callback: 'workout' }],
        [{ text: '🎯 Прогресс', callback: 'progress' }],
        [{ text: '💎 Premium', callback: 'premium' }]
      ];
      
      sendMessageWithButtons(chatId, 
        `🏋️ <b>КОМАНДЫ ФИТНЕС-БОТА:</b>

💪 /calories - калькулятор калорий
📊 /workout - записать тренировку  
🎯 /progress - мой прогресс
💎 /premium - премиум функции
ℹ️ /help - это меню

Выбери команду и начнём тренироваться! 💪`, helpButtons);
      break;

    case '/calories':
      const calorieButtons = [
        [{ text: '🔢 Рассчитать норму', callback: 'calc_calories' }],
        [{ text: '🍎 Записать приём пищи', callback: 'log_food' }],
        [{ text: '📋 Дневник питания', callback: 'food_diary' }]
      ];
      
      sendMessageWithButtons(chatId,
        `🍎 <b>КАЛЬКУЛЯТОР КАЛОРИЙ</b>

Что хочешь сделать?`, calorieButtons);
      break;

    case '/workout':
      const workoutButtons = [
        [{ text: '🏃‍♂️ Кардио', callback: 'cardio' }, { text: '🏋️‍♀️ Силовая', callback: 'strength' }],
        [{ text: '🧘‍♀️ Йога/Растяжка', callback: 'yoga' }],
        [{ text: '📊 Мои тренировки', callback: 'my_workouts' }]
      ];
      
      sendMessageWithButtons(chatId,
        `💪 <b>ЗАПИСЬ ТРЕНИРОВКИ</b>

Какой тип тренировки?`, workoutButtons);
      break;

    case '/progress':
      sendMessage(chatId, 
        `📊 <b>ТВОЙ ПРОГРЕСС</b>

🔥 Тренировок за неделю: 0
💪 Силовых: 0 | 🏃‍♂️ Кардио: 0
📈 Средние калории: 0

🎯 <b>ЦЕЛИ:</b>
- Тренировки: 0/3 в неделю
- Калории: 0/2000 в день

💡 <i>Для детального трекинга подключи Premium!</i>`);
      break;

    case '/premium':
      const premiumButtons = [
        [{ text: '💎 Купить Premium - $3/мес', callback: 'buy_premium' }],
        [{ text: 'ℹ️ Что входит?', callback: 'premium_info' }]
      ];
      
      sendMessageWithButtons(chatId,
        `💎 <b>PREMIUM ВОЗМОЖНОСТИ</b>

🎯 <b>Что получишь:</b>
• Персональные планы питания
• Программы тренировок
• Детальная аналитика прогресса
• Напоминания и мотивация
• Экспорт данных в PDF
• Приоритетная поддержка

💰 <b>Цена:</b> $3/месяц

🎁 <b>Первые 7 дней БЕСПЛАТНО!</b>`, premiumButtons);
      break;

    default:
      sendMessage(chatId, 
        `🤔 Не понял команду "${text}"

Напиши /help для списка доступных команд!`);
      break;
  }
}

// Обработка callback кнопок
function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const firstName = callbackQuery.from.first_name || 'Друг';

  switch (data) {
    case 'calories':
      handleCommand({ chat: { id: chatId }, text: '/calories', from: { first_name: firstName } });
      break;

    case 'workout':
      handleCommand({ chat: { id: chatId }, text: '/workout', from: { first_name: firstName } });
      break;

    case 'progress':
      handleCommand({ chat: { id: chatId }, text: '/progress', from: { first_name: firstName } });
      break;

    case 'premium':
      handleCommand({ chat: { id: chatId }, text: '/premium', from: { first_name: firstName } });
      break;

    case 'calc_calories':
      sendMessage(chatId, 
        `🔢 <b>КАЛЬКУЛЯТОР КАЛОРИЙ</b>

Для расчёта твоей нормы калорий мне нужны данные:

📝 <b>Отправь в формате:</b>
<code>Вес Рост Возраст Пол Активность</code>

📋 <b>Пример:</b>
<code>70 175 25 м умеренная</code>

🔸 <b>Пол:</b> м/ж
🔸 <b>Активность:</b> низкая, лёгкая, умеренная, высокая, очень_высокая`);
      break;

    case 'log_food':
      sendMessage(chatId,
        `🍎 <b>ЗАПИСЬ ПРИЁМА ПИЩИ</b>

📝 <b>Отправь в формате:</b>
<code>Продукт Количество</code>

📋 <b>Примеры:</b>
<code>Овсянка 100г</code>
<code>Куриная грудка 150г</code>
<code>Яблоко 1шт</code>

💡 <i>В Premium версии доступна база из 10,000+ продуктов!</i>`);
      break;

    case 'cardio':
      sendMessage(chatId,
        `🏃‍♂️ <b>КАРДИО ТРЕНИРОВКА</b>

📝 <b>Отправь в формате:</b>
<code>Тип Длительность Интенсивность</code>

📋 <b>Примеры:</b>
<code>Бег 30мин средняя</code>
<code>Велосипед 45мин высокая</code>
<code>Ходьба 60мин низкая</code>

✅ <i>Тренировка будет записана в твой дневник!</i>`);
      break;

    case 'strength':
      sendMessage(chatId,
        `🏋️‍♀️ <b>СИЛОВАЯ ТРЕНИРОВКА</b>

📝 <b>Отправь в формате:</b>
<code>Упражнение Подходы×Повторы Вес</code>

📋 <b>Примеры:</b>
<code>Жим лёжа 3×8 80кг</code>
<code>Приседания 4×12 собственный_вес</code>
<code>Тяга верхнего блока 3×10 60кг</code>

✅ <i>Упражнения будут сохранены в твоём прогрессе!</i>`);
      break;

    case 'buy_premium':
      sendMessage(chatId,
        `💎 <b>ПОКУПКА PREMIUM</b>

🎁 <b>7 дней БЕСПЛАТНО!</b>
Затем $3/месяц

💳 <b>Способы оплаты:</b>
• Банковская карта
• PayPal  
• Apple Pay / Google Pay
• Криптовалюта

📞 <b>Поддержка:</b> @support_bot

⚡ <i>Активация мгновенная!</i>
🔒 <i>Безопасные платежи через Stripe</i>

Для покупки напиши: <code>КУПИТЬ PREMIUM</code>`);
      break;

    case 'premium_info':
      sendMessage(chatId,
        `💎 <b>PREMIUM ПОДРОБНО</b>

🍎 <b>Питание:</b>
• База 10,000+ продуктов с КБЖУ
• Персональные планы питания
• Рецепты и меню на неделю
• Трекинг воды и витаминов

💪 <b>Тренировки:</b>
• Программы от профи-тренеров
• Видео-упражнения HD качества
• Планы для дома и зала
• Адаптация под твой уровень

📊 <b>Аналитика:</b>
• Детальные графики прогресса
• Сравнение с предыдущими периодами
• Прогнозы достижения целей
• Экспорт отчётов в PDF

🎯 <b>Мотивация:</b>
• Ежедневные напоминания
• Система достижений и наград
• Персональные рекомендации
• Поддержка куратора

💰 <b>Стоимость:</b> $3/месяц
🎁 <b>Пробный период:</b> 7 дней бесплатно`);
      break;

    default:
      sendMessage(chatId, '🤔 Неизвестная команда. Попробуй ещё раз!');
      break;
  }
}

// Обработка расчёта калорий из текста
function handleCalorieCalculation(message) {
  const text = message.text;
  const parts = text.split(' ');
  
  if (parts.length === 5) {
    const [weight, height, age, gender, activity] = parts;
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);
    const genderEn = gender.toLowerCase() === 'м' ? 'male' : 'female';
    
    const activityMap = {
      'низкая': 'sedentary',
      'лёгкая': 'light', 
      'умеренная': 'moderate',
      'высокая': 'active',
      'очень_высокая': 'very_active'
    };
    
    const activityEn = activityMap[activity.toLowerCase()];
    
    if (weightNum && heightNum && ageNum && activityEn) {
      const calories = calculateCalories(weightNum, heightNum, ageNum, genderEn, activityEn);
      
      const resultText = `🔥 <b>ТВОЯ НОРМА КАЛОРИЙ</b>

👤 <b>Данные:</b>
Вес: ${weightNum}кг | Рост: ${heightNum}см | Возраст: ${ageNum}лет
Пол: ${gender.toUpperCase()} | Активность: ${activity}

📊 <b>Результаты:</b>
🔸 Базовый метаболизм: <b>${calories.bmr} ккал/день</b>
🔸 С учётом активности: <b>${calories.daily} ккал/день</b>

🎯 <b>Рекомендации:</b>
• Для похудения: ${calories.daily - 300}-${calories.daily - 500} ккал
• Для набора массы: ${calories.daily + 300}-${calories.daily + 500} ккал
• Для поддержания: ${calories.daily} ккал

💡 <i>В Premium доступны персональные планы питания!</i>`;

      sendMessage(message.chat.id, resultText);
      return true;
    }
  }
  return false;
}

// Главный webhook endpoint
app.post('/webhook', (req, res) => {
  const update = req.body;
  
  try {
    if (update.message) {
      const message = update.message;
      
      // Проверяем, не является ли это расчётом калорий
      if (message.text && !message.text.startsWith('/')) {
        const isCalorieCalc = handleCalorieCalculation(message);
        if (!isCalorieCalc) {
          // Если не расчёт калорий, отправляем в help
          sendMessage(message.chat.id, 
            `🤔 Не понял сообщение "${message.text}"
            
Напиши /help для списка команд!`);
        }
      } else if (message.text) {
        handleCommand(message);
      }
    } else if (update.callback_query) {
      handleCallback(update.callback_query);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).send('Error');
  }
});

// Endpoint для проверки статуса
app.get('/', (req, res) => {
  res.send('🤖 FitnessHelper Bot работает!');
});

// Endpoint для установки webhook
app.get('/setWebhook', async (req, res) => {
  try {
    const webhookUrl = `${req.protocol}://${req.get('host')}/webhook`;
    const response = await axios.post(`${API_URL}/setWebhook`, {
      url: webhookUrl
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

module.exports = app;