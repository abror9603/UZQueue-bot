'use strict';

const regionsData = [
  { code: 'TO', nameUz: 'Toshkent', nameRu: 'Ташкент', nameEn: 'Tashkent' },
  { code: 'TS', nameUz: 'Toshkent sh.', nameRu: 'г. Ташкент', nameEn: 'Tashkent City' },
  { code: 'AN', nameUz: 'Andijon', nameRu: 'Андижан', nameEn: 'Andijan' },
  { code: 'FA', nameUz: 'Farg\'ona', nameRu: 'Фергана', nameEn: 'Fergana' },
  { code: 'NA', nameUz: 'Namangan', nameRu: 'Наманган', nameEn: 'Namangan' },
  { code: 'SI', nameUz: 'Sirdaryo', nameRu: 'Сырдарья', nameEn: 'Sirdaryo' },
  { code: 'JI', nameUz: 'Jizzax', nameRu: 'Джизак', nameEn: 'Jizzakh' },
  { code: 'BU', nameUz: 'Buxoro', nameRu: 'Бухара', nameEn: 'Bukhara' },
  { code: 'SA', nameUz: 'Samarqand', nameRu: 'Самарканд', nameEn: 'Samarkand' },
  { code: 'NV', nameUz: 'Navoiy', nameRu: 'Навои', nameEn: 'Navoi' },
  { code: 'QA', nameUz: 'Qashqadaryo', nameRu: 'Кашкадарья', nameEn: 'Kashkadarya' },
  { code: 'SU', nameUz: 'Surxandaryo', nameRu: 'Сурхандарья', nameEn: 'Surkhandarya' },
  { code: 'XO', nameUz: 'Xorazm', nameRu: 'Хорезм', nameEn: 'Khorezm' },
  { code: 'QQ', nameUz: 'Qoraqolpog\'iston', nameRu: 'Каракалпакстан', nameEn: 'Karakalpakstan' }
];

// Asosiy tumanlar har bir viloyat uchun
const districtsData = {
  'TO': [ // Toshkent viloyati
    { code: 'BO', nameUz: 'Bekobod', nameRu: 'Бекабад', nameEn: 'Bekabad' },
    { code: 'BO', nameUz: 'Bo\'ka', nameRu: 'Бука', nameEn: 'Buka' },
    { code: 'BO', nameUz: 'Bo\'stonliq', nameRu: 'Бустанлык', nameEn: 'Bostanlyk' },
    { code: 'ZC', nameUz: 'Zangiota', nameRu: 'Зангиота', nameEn: 'Zangiota' },
    { code: 'QY', nameUz: 'Qibray', nameRu: 'Кибрай', nameEn: 'Qibray' },
    { code: 'OH', nameUz: 'Ohangaron', nameRu: 'Ахангаран', nameEn: 'Ohangaron' },
    { code: 'PR', nameUz: 'Parkent', nameRu: 'Паркент', nameEn: 'Parkent' },
    { code: 'PT', nameUz: 'Piskent', nameRu: 'Пискент', nameEn: 'Piskent' },
    { code: 'QU', nameUz: 'Quyichirchiq', nameRu: 'Куйичирчик', nameEn: 'Quyichirchiq' },
    { code: 'TK', nameUz: 'Toshkent tumani', nameRu: 'Ташкентский район', nameEn: 'Tashkent District' },
    { code: 'UR', nameUz: 'O\'rtachirchiq', nameRu: 'Уртачирчик', nameEn: 'Urtachirchiq' },
    { code: 'CH', nameUz: 'Chinoz', nameRu: 'Чиназ', nameEn: 'Chinoz' },
    { code: 'YU', nameUz: 'Yunusobod', nameRu: 'Юнусабад', nameEn: 'Yunusabad' },
    { code: 'YM', nameUz: 'Yangiqo\'rg\'on', nameRu: 'Янгикурган', nameEn: 'Yangiqorgon' }
  ],
  'TS': [ // Toshkent shahri
    { code: 'OL', nameUz: 'Olmazor', nameRu: 'Алмазар', nameEn: 'Olmazar' },
    { code: 'BE', nameUz: 'Bektemir', nameRu: 'Бектемир', nameEn: 'Bektemir' },
    { code: 'MI', nameUz: 'Mirobod', nameRu: 'Миробод', nameEn: 'Mirobod' },
    { code: 'MU', nameUz: 'Mirzo Ulug\'bek', nameRu: 'Мирзо Улугбек', nameEn: 'Mirzo Ulugbek' },
    { code: 'SE', nameUz: 'Sergeli', nameRu: 'Сергели', nameEn: 'Sergeli' },
    { code: 'UL', nameUz: 'Uchtepa', nameRu: 'Учтепа', nameEn: 'Uchtepa' },
    { code: 'SH', nameUz: 'Shayxontohur', nameRu: 'Шайхантохур', nameEn: 'Shaykhontohur' },
    { code: 'YU', nameUz: 'Yashnobod', nameRu: 'Яшнабад', nameEn: 'Yashnabad' },
    { code: 'CH', nameUz: 'Chilonzor', nameRu: 'Чилонзар', nameEn: 'Chilonzor' },
    { code: 'YA', nameUz: 'Yunusobod', nameRu: 'Юнусабад', nameEn: 'Yunusabad' },
    { code: 'YA', nameUz: 'Yakkasaroy', nameRu: 'Яккасарай', nameEn: 'Yakkasaroy' }
  ],
  'AN': [ // Andijon viloyati
    { code: 'AN', nameUz: 'Andijon shahri', nameRu: 'г. Андижан', nameEn: 'Andijan City' },
    { code: 'AS', nameUz: 'Asaka', nameRu: 'Асака', nameEn: 'Asaka' },
    { code: 'BA', nameUz: 'Baliqchi', nameRu: 'Балыкчи', nameEn: 'Baliqchi' },
    { code: 'BO', nameUz: 'Bo\'z', nameRu: 'Боз', nameEn: 'Boz' },
    { code: 'BU', nameUz: 'Buloqboshi', nameRu: 'Булокбоши', nameEn: 'Buloqboshi' },
    { code: 'IZ', nameUz: 'Izboskan', nameRu: 'Избоскан', nameEn: 'Izboskan' },
    { code: 'JA', nameUz: 'Jalaquduq', nameRu: 'Жалакудук', nameEn: 'Jalaquduq' },
    { code: 'QA', nameUz: 'Qo\'rg\'ontepa', nameRu: 'Кургантепа', nameEn: 'Qorgontepa' },
    { code: 'PA', nameUz: 'Paxtaobod', nameRu: 'Пахтаабад', nameEn: 'Paxtaobod' },
    { code: 'UL', nameUz: 'Ulug\'nor', nameRu: 'Улугнор', nameEn: 'Ulugnor' },
    { code: 'XO', nameUz: 'Xonobod', nameRu: 'Ханабад', nameEn: 'Xonobod' },
    { code: 'SH', nameUz: 'Shahrixon', nameRu: 'Шахрихан', nameEn: 'Shahrixon' }
  ],
  'FA': [ // Farg'ona viloyati
    { code: 'FA', nameUz: 'Farg\'ona shahri', nameRu: 'г. Фергана', nameEn: 'Fergana City' },
    { code: 'BE', nameUz: 'Beshariq', nameRu: 'Бешарык', nameEn: 'Beshariq' },
    { code: 'BU', nameUz: 'Bog\'dod', nameRu: 'Багдат', nameEn: 'Bogdod' },
    { code: 'BU', nameUz: 'Buvayda', nameRu: 'Бувайда', nameEn: 'Buvayda' },
    { code: 'DA', nameUz: 'Dang\'ara', nameRu: 'Дангара', nameEn: 'Dangara' },
    { code: 'FU', nameUz: 'Farg\'ona tumani', nameRu: 'Ферганский район', nameEn: 'Fergana District' },
    { code: 'FR', nameUz: 'Furqat', nameRu: 'Фуркат', nameEn: 'Furqat' },
    { code: 'QO', nameUz: 'Qo\'qon', nameRu: 'Коканд', nameEn: 'Kokand' },
    { code: 'QO', nameUz: 'Qo\'shtepa', nameRu: 'Куштепа', nameEn: 'Qoshtepa' },
    { code: 'RI', nameUz: 'Rishton', nameRu: 'Риштан', nameEn: 'Rishton' },
    { code: 'SO', nameUz: 'So\'x', nameRu: 'Сох', nameEn: 'Sox' },
    { code: 'TO', nameUz: 'Toshloq', nameRu: 'Ташлак', nameEn: 'Toshloq' },
    { code: 'UZ', nameUz: 'Uchko\'prik', nameRu: 'Учкоприк', nameEn: 'Uchkoprik' },
    { code: 'YO', nameUz: 'Yozyovon', nameRu: 'Язъяван', nameEn: 'Yozyovon' },
    { code: 'OH', nameUz: 'O\'zbekiston', nameRu: 'Узбекистан', nameEn: 'Uzbekistan' }
  ],
  'NA': [ // Namangan viloyati
    { code: 'NA', nameUz: 'Namangan shahri', nameRu: 'г. Наманган', nameEn: 'Namangan City' },
    { code: 'CH', nameUz: 'Chortoq', nameRu: 'Чартак', nameEn: 'Chortoq' },
    { code: 'CH', nameUz: 'Chust', nameRu: 'Чуст', nameEn: 'Chust' },
    { code: 'KA', nameUz: 'Kosonsoy', nameRu: 'Касансай', nameEn: 'Kosonsoy' },
    { code: 'MI', nameUz: 'Mingbuloq', nameRu: 'Мингбулак', nameEn: 'Mingbuloq' },
    { code: 'NO', nameUz: 'Norin', nameRu: 'Нарын', nameEn: 'Norin' },
    { code: 'PA', nameUz: 'Pop', nameRu: 'Поп', nameEn: 'Pop' },
    { code: 'TO', nameUz: 'To\'raqo\'rg\'on', nameRu: 'Туракурган', nameEn: 'Toraqorgon' },
    { code: 'UD', nameUz: 'Uchqo\'rg\'on', nameRu: 'Учкурган', nameEn: 'Uchqorgon' },
    { code: 'UY', nameUz: 'Uychi', nameRu: 'Уйчи', nameEn: 'Uychi' },
    { code: 'YA', nameUz: 'Yangiqo\'rg\'on', nameRu: 'Янгикурган', nameEn: 'Yangiqorgon' }
  ],
  'SI': [ // Sirdaryo viloyati
    { code: 'GU', nameUz: 'Guliston shahri', nameRu: 'г. Гулистан', nameEn: 'Gulistan City' },
    { code: 'BO', nameUz: 'Boyovut', nameRu: 'Бояут', nameEn: 'Boyovut' },
    { code: 'GU', nameUz: 'Guliston tumani', nameRu: 'Гулистанский район', nameEn: 'Gulistan District' },
    { code: 'MI', nameUz: 'Mirzaobod', nameRu: 'Мирзаабад', nameEn: 'Mirzaobod' },
    { code: 'OV', nameUz: 'Oqoltin', nameRu: 'Оклытин', nameEn: 'Oqoltin' },
    { code: 'SA', nameUz: 'Sardoba', nameRu: 'Сардоба', nameEn: 'Sardoba' },
    { code: 'SA', nameUz: 'Sayxunobod', nameRu: 'Сайхунабад', nameEn: 'Sayxunobod' },
    { code: 'SH', nameUz: 'Sirdaryo tumani', nameRu: 'Сырдарьинский район', nameEn: 'Sirdaryo District' },
    { code: 'XO', nameUz: 'Xovos', nameRu: 'Хавас', nameEn: 'Xovos' },
    { code: 'YA', nameUz: 'Yangiyer', nameRu: 'Янгиер', nameEn: 'Yangiyer' }
  ],
  'JI': [ // Jizzax viloyati
    { code: 'JI', nameUz: 'Jizzax shahri', nameRu: 'г. Джизак', nameEn: 'Jizzakh City' },
    { code: 'AR', nameUz: 'Arnasoy', nameRu: 'Арнасой', nameEn: 'Arnasoy' },
    { code: 'BA', nameUz: 'Bakhmal', nameRu: 'Бахмал', nameEn: 'Bakhmal' },
    { code: 'DO', nameUz: 'Do\'stlik', nameRu: 'Дустлик', nameEn: 'Dostlik' },
    { code: 'FO', nameUz: 'Forish', nameRu: 'Фориш', nameEn: 'Forish' },
    { code: 'GA', nameUz: 'G\'allaorol', nameRu: 'Галляарал', nameEn: 'Gallarol' },
    { code: 'JA', nameUz: 'Jizzax tumani', nameRu: 'Джизакский район', nameEn: 'Jizzakh District' },
    { code: 'MI', nameUz: 'Mirzacho\'l', nameRu: 'Мирзачул', nameEn: 'Mirzachol' },
    { code: 'PA', nameUz: 'Paxtakor', nameRu: 'Пахтакор', nameEn: 'Paxtakor' },
    { code: 'YA', nameUz: 'Yangibozor', nameRu: 'Янгибазар', nameEn: 'Yangibozor' },
    { code: 'ZA', nameUz: 'Zafarobod', nameRu: 'Зафарабад', nameEn: 'Zafarobod' },
    { code: 'ZA', nameUz: 'Zarbdor', nameRu: 'Зарбдар', nameEn: 'Zarbdor' }
  ],
  'BU': [ // Buxoro viloyati
    { code: 'BU', nameUz: 'Buxoro shahri', nameRu: 'г. Бухара', nameEn: 'Bukhara City' },
    { code: 'OL', nameUz: 'Olot', nameRu: 'Олот', nameEn: 'Olot' },
    { code: 'BU', nameUz: 'Buxoro tumani', nameRu: 'Бухарский район', nameEn: 'Bukhara District' },
    { code: 'VO', nameUz: 'Vobkent', nameRu: 'Вабкент', nameEn: 'Vobkent' },
    { code: 'GI', nameUz: 'G\'ijduvon', nameRu: 'Гиждуван', nameEn: 'Gijduvon' },
    { code: 'JO', nameUz: 'Jondor', nameRu: 'Жондор', nameEn: 'Jondor' },
    { code: 'KA', nameUz: 'Kogon', nameRu: 'Каган', nameEn: 'Kogon' },
    { code: 'QO', nameUz: 'Qorako\'l', nameRu: 'Каракуль', nameEn: 'Qorakol' },
    { code: 'QA', nameUz: 'Qorovulbozor', nameRu: 'Караулбазар', nameEn: 'Qorovulbozor' },
    { code: 'PE', nameUz: 'Peshku', nameRu: 'Пешку', nameEn: 'Peshku' },
    { code: 'RO', nameUz: 'Romitan', nameRu: 'Ромитан', nameEn: 'Romitan' },
    { code: 'SH', nameUz: 'Shofirkon', nameRu: 'Шафиркан', nameEn: 'Shofirkon' }
  ],
  'SA': [ // Samarqand viloyati
    { code: 'SA', nameUz: 'Samarqand shahri', nameRu: 'г. Самарканд', nameEn: 'Samarkand City' },
    { code: 'BU', nameUz: 'Bulung\'ur', nameRu: 'Булунгар', nameEn: 'Bulungur' },
    { code: 'IS', nameUz: 'Ishtixon', nameRu: 'Иштихан', nameEn: 'Ishtixon' },
    { code: 'JA', nameUz: 'Jomboy', nameRu: 'Жомбой', nameEn: 'Jomboy' },
    { code: 'KA', nameUz: 'Kattaqo\'rg\'on', nameRu: 'Каттакурган', nameEn: 'Kattaqorgon' },
    { code: 'QA', nameUz: 'Qo\'shrabot', nameRu: 'Кушрабад', nameEn: 'Qoshrabot' },
    { code: 'NU', nameUz: 'Narpay', nameRu: 'Нарпай', nameEn: 'Narpay' },
    { code: 'NU', nameUz: 'Nurobod', nameRu: 'Нуробад', nameEn: 'Nurobod' },
    { code: 'OY', nameUz: 'Oqdaryo', nameRu: 'Акдарья', nameEn: 'Oqdaryo' },
    { code: 'PA', nameUz: 'Pastdarg\'om', nameRu: 'Пастдаргом', nameEn: 'Pastdargom' },
    { code: 'PA', nameUz: 'Paxtachi', nameRu: 'Пахтачи', nameEn: 'Paxtachi' },
    { code: 'PU', nameUz: 'Payariq', nameRu: 'Пайарик', nameEn: 'Payariq' },
    { code: 'PU', nameUz: 'Pomabog\'', nameRu: 'Помабаг', nameEn: 'Pomabog' },
    { code: 'UR', nameUz: 'Urgut', nameRu: 'Ургут', nameEn: 'Urgut' }
  ],
  'NV': [ // Navoiy viloyati
    { code: 'NV', nameUz: 'Navoiy shahri', nameRu: 'г. Навои', nameEn: 'Navoi City' },
    { code: 'KA', nameUz: 'Karmana', nameRu: 'Кармана', nameEn: 'Karmana' },
    { code: 'KA', nameUz: 'Konimex', nameRu: 'Конимех', nameEn: 'Konimex' },
    { code: 'NA', nameUz: 'Navbahor', nameRu: 'Навбахор', nameEn: 'Navbahor' },
    { code: 'NU', nameUz: 'Nurota', nameRu: 'Нурата', nameEn: 'Nurota' },
    { code: 'QI', nameUz: 'Qiziltepa', nameRu: 'Кызылтепа', nameEn: 'Qiziltepa' },
    { code: 'TO', nameUz: 'Tomdi', nameRu: 'Томди', nameEn: 'Tomdi' },
    { code: 'UC', nameUz: 'Uchquduq', nameRu: 'Учкудук', nameEn: 'Uchquduq' },
    { code: 'XA', nameUz: 'Xatirchi', nameRu: 'Хатырчи', nameEn: 'Xatirchi' },
    { code: 'ZA', nameUz: 'Zarafshon', nameRu: 'Зарафшан', nameEn: 'Zarafshon' }
  ],
  'QA': [ // Qashqadaryo viloyati
    { code: 'QA', nameUz: 'Qarshi shahri', nameRu: 'г. Карши', nameEn: 'Karshi City' },
    { code: 'CH', nameUz: 'Chiroqchi', nameRu: 'Чиракчи', nameEn: 'Chiroqchi' },
    { code: 'DE', nameUz: 'Dehqonobod', nameRu: 'Дехканобад', nameEn: 'Dehqonobod' },
    { code: 'GU', nameUz: 'G\'uzor', nameRu: 'Гузар', nameEn: 'Guzor' },
    { code: 'KA', nameUz: 'Koson', nameRu: 'Касан', nameEn: 'Koson' },
    { code: 'KA', nameUz: 'Kamashi', nameRu: 'Камаши', nameEn: 'Kamashi' },
    { code: 'KA', nameUz: 'Karshi tumani', nameRu: 'Каршинский район', nameEn: 'Karshi District' },
    { code: 'KA', nameUz: 'Kasbi', nameRu: 'Каспи', nameEn: 'Kasbi' },
    { code: 'KI', nameUz: 'Kitob', nameRu: 'Китаб', nameEn: 'Kitob' },
    { code: 'MU', nameUz: 'Muborak', nameRu: 'Мубарек', nameEn: 'Muborak' },
    { code: 'NI', nameUz: 'Nishon', nameRu: 'Нишан', nameEn: 'Nishon' },
    { code: 'SH', nameUz: 'Shahrisabz', nameRu: 'Шахрисабз', nameEn: 'Shahrisabz' },
    { code: 'YA', nameUz: 'Yakkabog\'', nameRu: 'Яккабог', nameEn: 'Yakkabog' }
  ],
  'SU': [ // Surxandaryo viloyati
    { code: 'SU', nameUz: 'Termiz shahri', nameRu: 'г. Термез', nameEn: 'Termez City' },
    { code: 'AN', nameUz: 'Angor', nameRu: 'Ангор', nameEn: 'Angor' },
    { code: 'BA', nameUz: 'Bandixon', nameRu: 'Бандихон', nameEn: 'Bandixon' },
    { code: 'BO', nameUz: 'Boysun', nameRu: 'Байсун', nameEn: 'Boysun' },
    { code: 'DE', nameUz: 'Denov', nameRu: 'Денау', nameEn: 'Denov' },
    { code: 'JA', nameUz: 'Jarqo\'rg\'on', nameRu: 'Жаркурган', nameEn: 'Jarqorgon' },
    { code: 'QI', nameUz: 'Qiziriq', nameRu: 'Кызырык', nameEn: 'Qiziriq' },
    { code: 'QU', nameUz: 'Qumqo\'rg\'on', nameRu: 'Кумкурган', nameEn: 'Qumqorgon' },
    { code: 'MU', nameUz: 'Muzrabot', nameRu: 'Музрабад', nameEn: 'Muzrabot' },
    { code: 'OL', nameUz: 'Oltinsoy', nameRu: 'Олтинсай', nameEn: 'Oltinsoy' },
    { code: 'SA', nameUz: 'Sariosiyo', nameRu: 'Сариасия', nameEn: 'Sariosiyo' },
    { code: 'SH', nameUz: 'Sherobod', nameRu: 'Шерабад', nameEn: 'Sherobod' },
    { code: 'SH', nameUz: 'Sho\'rchi', nameRu: 'Шурчи', nameEn: 'Shorchi' },
    { code: 'TE', nameUz: 'Termiz tumani', nameRu: 'Термезский район', nameEn: 'Termez District' },
    { code: 'UZ', nameUz: 'Uzun', nameRu: 'Узун', nameEn: 'Uzun' }
  ],
  'XO': [ // Xorazm viloyati
    { code: 'XO', nameUz: 'Urganch shahri', nameRu: 'г. Ургенч', nameEn: 'Urgench City' },
    { code: 'BO', nameUz: 'Bog\'ot', nameRu: 'Багот', nameEn: 'Bogot' },
    { code: 'GU', nameUz: 'Gurlan', nameRu: 'Гурлан', nameEn: 'Gurlan' },
    { code: 'XO', nameUz: 'Xonqa', nameRu: 'Ханка', nameEn: 'Xonqa' },
    { code: 'HO', nameUz: 'Hazorasp', nameRu: 'Хазарасп', nameEn: 'Hazorasp' },
    { code: 'HI', nameUz: 'Hiva', nameRu: 'Хива', nameEn: 'Khiva' },
    { code: 'QU', nameUz: 'Qo\'shko\'pir', nameRu: 'Кушкопир', nameEn: 'Qoshkopir' },
    { code: 'SH', nameUz: 'Shovot', nameRu: 'Шават', nameEn: 'Shovot' },
    { code: 'UR', nameUz: 'Urganch tumani', nameRu: 'Ургенчский район', nameEn: 'Urgench District' },
    { code: 'YA', nameUz: 'Yangiariq', nameRu: 'Янгиарык', nameEn: 'Yangiariq' },
    { code: 'YA', nameUz: 'Yangibozor', nameRu: 'Янгибазар', nameEn: 'Yangibozor' }
  ],
  'QQ': [ // Qoraqolpog'iston
    { code: 'QQ', nameUz: 'Nukus shahri', nameRu: 'г. Нукус', nameEn: 'Nukus City' },
    { code: 'AM', nameUz: 'Amudaryo', nameRu: 'Амударья', nameEn: 'Amudaryo' },
    { code: 'BE', nameUz: 'Beruniy', nameRu: 'Беруни', nameEn: 'Beruniy' },
    { code: 'CH', nameUz: 'Chimboy', nameRu: 'Чимбай', nameEn: 'Chimboy' },
    { code: 'EL', nameUz: 'Ellikqala', nameRu: 'Элликкала', nameEn: 'Ellikqala' },
    { code: 'KE', nameUz: 'Kegeyli', nameRu: 'Кегейли', nameEn: 'Kegeyli' },
    { code: 'MO', nameUz: 'Mo\'ynoq', nameRu: 'Муйнак', nameEn: 'Moynoq' },
    { code: 'NU', nameUz: 'Nukus tumani', nameRu: 'Нукусский район', nameEn: 'Nukus District' },
    { code: 'QO', nameUz: 'Qonliko\'l', nameRu: 'Конликколь', nameEn: 'Qonlikol' },
    { code: 'QO', nameUz: 'Qorao\'zak', nameRu: 'Караузак', nameEn: 'Qoraozak' },
    { code: 'QO', nameUz: 'Qo\'ng\'irot', nameRu: 'Кунград', nameEn: 'Qongirot' },
    { code: 'SH', nameUz: 'Shumanay', nameRu: 'Шуманай', nameEn: 'Shumanay' },
    { code: 'TA', nameUz: 'Taxtako\'pir', nameRu: 'Тахтакупыр', nameEn: 'Taxtakopir' },
    { code: 'TO', nameUz: 'To\'rtko\'l', nameRu: 'Турткуль', nameEn: 'Tortkol' },
    { code: 'XO', nameUz: 'Xo\'jayli', nameRu: 'Ходжейли', nameEn: 'Xojayli' }
  ]
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if regions already exist
    const existingRegions = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM regions',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingRegions[0].count > 0) {
      console.log('Regions already exist, skipping seed');
      return;
    }

    // Insert regions
    const insertedRegions = await queryInterface.bulkInsert('regions', 
      regionsData.map(r => ({
        name_uz: r.nameUz,
        name_ru: r.nameRu,
        name_en: r.nameEn,
        code: r.code,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })), 
      { returning: true }
    );

    // Get region IDs by code
    const regionMap = {};
    const allRegions = await queryInterface.sequelize.query(
      'SELECT id, code FROM regions',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const region of allRegions) {
      regionMap[region.code] = region.id;
    }

    // Insert districts for each region
    const allDistricts = [];
    for (const [regionCode, districts] of Object.entries(districtsData)) {
      const regionId = regionMap[regionCode];
      if (!regionId) continue;

      for (const d of districts) {
        allDistricts.push({
          region_id: regionId,
          name_uz: d.nameUz,
          name_ru: d.nameRu,
          name_en: d.nameEn,
          code: d.code,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    if (allDistricts.length > 0) {
      await queryInterface.bulkInsert('districts', allDistricts);
    }

    // Note: For neighborhoods, we can add them later or create a separate seed file
    // as there are many neighborhoods and it would make this file too large
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('districts', null, {});
    await queryInterface.bulkDelete('regions', null, {});
  }
};
