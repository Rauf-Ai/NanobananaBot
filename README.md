# PicGen 🎨

Telegram-бот для генерации изображений с помощью ИИ на основе Nano Banana API с системой оплаты через Telegram Payments (ЮKassa).

## Описание

PicGen — это полнофункциональный Telegram-бот, позволяющий пользователям генерировать изображения с помощью искусственного интеллекта. Бот поддерживает различные стили, соотношения сторон и разрешения. Для генерации используется система кредитов: новые пользователи получают 3 бесплатных кредита, а дополнительные кредиты можно купить через встроенную платёжную систему Telegram.

---

## Возможности

- 🎨 **Генерация изображений** — 8 стилей, 5 соотношений сторон, 3 разрешения (1K/2K/4K)
- 💰 **Система кредитов** — бесплатные и платные кредиты
- 💳 **Оплата через Telegram** — интеграция с ЮKassa
- 📚 **История генераций** — постраничный просмотр, повторная генерация
- 👥 **Реферальная программа** — бонусные кредиты за привлечение друзей
- 🌐 **Мультиязычность** — русский и английский интерфейс
- 🔧 **Панель администратора** — статистика, управление пользователями, промокоды, рассылка
- 🎟️ **Промокоды** — создание и использование промокодов
- ⚡ **Очередь задач** — BullMQ + Redis для надёжной обработки
- 📊 **Логирование** — структурированные логи через Winston

---

## Технологии

| Компонент | Технология |
|-----------|-----------|
| Runtime | Node.js 20 |
| Язык | TypeScript (ES Modules) |
| Telegram | grammY |
| База данных | PostgreSQL 16 + Prisma ORM |
| Очередь | BullMQ + Redis 7 |
| API генерации | Nano Banana API |
| Оплата | Telegram Payments + ЮKassa |
| Деплой | Docker Compose |
| Логирование | Winston |

---

## Требования

- [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/)
- Telegram Bot Token (от [@BotFather](https://t.me/BotFather))
- API ключ Nano Banana
- Токен провайдера платежей ЮKassa

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/KKhabarov/PicGen.git
cd PicGen
```

### 2. Настроить переменные окружения

```bash
cp .env.example .env
nano .env  # Заполнить все переменные
```

### 3. Запустить через Docker Compose

```bash
docker-compose up -d
```

### 4. Проверить логи

```bash
docker-compose logs -f app
```

---

## Конфигурация (.env)

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `BOT_TOKEN` | Токен Telegram бота от BotFather | `123456789:AABBcc...` |
| `ADMIN_TELEGRAM_IDS` | Telegram ID администраторов (через запятую) | `123456789,987654321` |
| `NANO_BANANA_API_KEY` | API ключ Nano Banana | `nb_...` |
| `NANO_BANANA_API_URL` | URL Nano Banana API | `https://api.nanobananaapi.dev` |
| `NANO_BANANA_MODEL` | Модель генерации изображений | `gemini-3-pro-image-preview` |
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://picgen:pass@postgres:5432/picgen` |
| `REDIS_URL` | URL подключения к Redis | `redis://redis:6379` |
| `PAYMENT_PROVIDER_TOKEN` | Токен провайдера ЮKassa | `381764628:TEST:...` |
| `NODE_ENV` | Окружение | `production` |
| `LOG_LEVEL` | Уровень логирования | `info` |
| `BOT_USERNAME` | Username бота (без @) | `PicGenBot` |

---

## Получение Nano Banana API ключа

1. Перейдите на [api.nanobananaapi.dev](https://api.nanobananaapi.dev)
2. Зарегистрируйтесь или войдите в аккаунт
3. В личном кабинете получите API ключ
4. Скопируйте ключ в `NANO_BANANA_API_KEY`

---

## Настройка Telegram бота (BotFather)

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Выполните `/newbot`
3. Введите имя бота и username (должен заканчиваться на `bot`)
4. Скопируйте токен в `BOT_TOKEN`
5. Настройте команды через `/setcommands`:

```
start - Начать работу
generate - Создать изображение
balance - Проверить баланс
buy - Купить кредиты
history - История генераций
referral - Реферальная программа
settings - Настройки
help - Справка
```

---

## Настройка ЮKassa для Telegram Payments

1. Зарегистрируйтесь в [ЮKassa](https://yookassa.ru)
2. Создайте магазин
3. Свяжите магазин с BotFather: `/mybots` → ваш бот → `Payments` → `ЮKassa`
4. Получите и скопируйте токен провайдера в `PAYMENT_PROVIDER_TOKEN`

> **Тестирование:** Для тестов используйте тестовые ключи ЮKassa (`381764628:TEST:...`)

---

## Назначение администраторов

Добавьте Telegram ID администраторов в `.env`:

```env
ADMIN_TELEGRAM_IDS=123456789,987654321
```

Чтобы узнать свой Telegram ID, напишите [@userinfobot](https://t.me/userinfobot).

После перезапуска бота указанные пользователи получат доступ к `/admin`.

---

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Регистрация и приветствие |
| `/generate` | Запустить генерацию изображения |
| `/balance` | Проверить баланс кредитов |
| `/buy` | Купить кредиты |
| `/history` | История генераций |
| `/referral` | Реферальная программа |
| `/settings` | Настройки (язык) |
| `/help` | Справка |
| `/admin` | Панель администратора (только для админов) |

---

## Пакеты кредитов

| Пакет | Кредиты | Цена |
|-------|---------|------|
| Starter | 10 | 99₽ |
| Basic | 30 | 249₽ |
| Pro | 100 | 699₽ |
| Ultra | 300 | 1799₽ |

---

## Стоимость генерации

| Разрешение | Кредиты |
|-----------|---------|
| 1K | 1 кредит |
| 2K | 2 кредита |
| 4K | 4 кредита |

---

## Разработка без Docker

### Требования

- Node.js 20+
- PostgreSQL
- Redis

### Установка

```bash
# Установить зависимости
npm install

# Настроить .env (указать локальные DATABASE_URL и REDIS_URL)
cp .env.example .env

# Применить миграции
npx prisma migrate dev

# Запустить в режиме разработки
npm run dev
```

---

## Структура проекта

```
PicGen/
├── docker-compose.yml        # Docker Compose конфигурация
├── Dockerfile                # Образ для Node.js приложения
├── package.json
├── tsconfig.json
├── .env.example              # Пример конфигурации
├── prisma/
│   └── schema.prisma         # Схема базы данных
└── src/
    ├── index.ts              # Точка входа
    ├── bot.ts                # Создание и настройка бота
    ├── config.ts             # Конфигурация с валидацией
    ├── types.ts              # TypeScript типы
    ├── commands/             # Обработчики команд
    │   ├── start.ts          # /start
    │   ├── generate.ts       # /generate
    │   ├── balance.ts        # /balance
    │   ├── buy.ts            # /buy
    │   ├── history.ts        # /history
    │   ├── referral.ts       # /referral
    │   ├── settings.ts       # /settings
    │   ├── help.ts           # /help
    │   └── admin.ts          # /admin
    ├── handlers/
    │   ├── payment.ts        # Обработчики платежей
    │   ├── callback.ts       # Обработчики inline кнопок
    │   └── message.ts        # Обработчик текстовых сообщений
    ├── services/
    │   ├── image-generator.ts # Интеграция Nano Banana API
    │   ├── payment.ts        # Логика платежей
    │   ├── user.ts           # CRUD пользователей
    │   ├── referral.ts       # Реферальная система
    │   └── history.ts        # История генераций
    ├── queues/
    │   ├── generation.queue.ts # BullMQ очередь
    │   └── generation.worker.ts # Воркер обработки
    ├── i18n/
    │   ├── index.ts          # Настройка i18n
    │   ├── ru.ts             # Переводы (русский)
    │   └── en.ts             # Переводы (английский)
    ├── keyboards/
    │   └── index.ts          # Inline клавиатуры
    ├── middleware/
    │   ├── auth.ts           # Регистрация/загрузка пользователя
    │   ├── admin.ts          # Проверка прав администратора
    │   ├── rate-limit.ts     # Ограничение частоты запросов
    │   └── i18n.ts           # Определение языка
    └── utils/
        ├── logger.ts         # Winston логгер
        ├── helpers.ts        # Вспомогательные функции
        └── constants.ts      # Константы приложения
```

---

## Лицензия

MIT
