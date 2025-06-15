# Lottery Smart Contract

Этот проект содержит смарт-контракт лотереи на Solidity и скрипты для деплоя и взаимодействия с ним.

В файле `hardhat.config.ts` настроена конфигурация с приватным ключем для owner, её необходимо обновить перед деплоем.

Перед использованием скриптов необходимо обновить данные в [constants/constants.ts](./constants/constants.ts).

Deploy:
```bash
npx hardhat ignition deploy ignition/modules/Lottery.ts --network local
```

Купить лотерейный билет:
```bash
npx ts-node scripts/buy-tickets.ts <PRIVATE_KEY> <TICKET_COUNT>
```

Получить информацию о владельце, призовом фонде и количестве проданных билетов:
```bash
npx ts-node scripts/get-status.ts
```

Посмотреть результат последней лотереи:
```bash
npx ts-node scripts/last-winner.ts
```

Завершить лотерею (только для владельца):
```bash
npx hardhat run scripts/draw-winner.ts --network local
```

Тестирование:
```bash
npx hardhat test
```
