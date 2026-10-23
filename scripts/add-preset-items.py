# -*- coding: utf-8 -*-
"""menu-presets.ts icindeki her preset'e 3 urun daha ekler (2 bolme x 3 urun olsun)."""
import io, re, sys

PATH = r"client/src/lib/menu-presets.ts"
src = io.open(PATH, encoding="utf-8").read()

EXTRA = {
 "food-truck": [("Tavuk Dürüm", "Acılı sos, turşu, patates", 85), ("Halloumi Dürüm", "Izgara halloumi, humus, roka", 90), ("Ev Limonatası", "Taze naneli, buz gibi", 35)],
 "cin-restorani": [("Kung Pao Tavuk", "Fıstıklı, kurutulmuş biberli", 96), ("Wok Noodle", "Sebzeli, soya soslu", 78), ("Buharda Mantı", "Xiaolongbao, domuz dolgulu", 84)],
 "kore": [("Tteokbokki", "Baharatlı pirinç erişte, mozzarella", 92), ("Kore Tavuğu", "Çıtır, acı soslu", 145), ("Yuzu Soda", "Yuzu şurubu, taze nane", 48)],
 "meksika": [("Quesadilla", "Cheddar, mozzarella, acı sos", 105), ("Nacho Grande", "Jalapeño, cheddar, salsa", 95), ("Margarita", "Tequila, lime, agave", 140)],
 "pizza": [("Margherita", "Fesleğen, mozzarella, San Marzano", 130), ("Pepperoni", "Bol pepperoni, jalapeño", 150), ("Tiramisu", "Mascarpone, espresso, kakao", 85)],
 "ramen": [("Shoyu Ramen", "Soya soslu, yumurtalı, nori", 135), ("Spicy Miso Ramen", "Acı miso, kıyma, mısır", 145), ("Gyoza", "5'li tavuklu", 75)],
 "sushi": [("California Roll", "8'li, yengeç, avokado", 165), ("Salmon Nigiri", "4'lü taze somon", 145), ("Miso Çorbası", "Tofu, wakame", 55)],
 "hint": [("Butter Chicken", "Tereyağlı tavuk, basmati pilav", 155), ("Sarımsaklı Naan", "Tandır ekmeği", 45), ("Mango Lassi", "Yoğurtlu, mangolu", 60)],
 "tay": [("Pad Thai", "Karides, fıstık, lime", 145), ("Tom Yum", "Acı-ekşi çorba, karidesli", 130), ("Mango Sticky Rice", "Tatlı mango, yapışkan pilav", 90)],
 "italyan": [("Tagliatelle", "Trüflü, parmesanlı", 175), ("Osso Buco", "Dana incik, risotto ile", 210), ("Panna Cotta", "Vanilya, meyve sosu", 80)],
 "barbeku": [("Smoked Brisket", "12 saat dumanlı dana göğüs", 260), ("BBQ Tavuk", "Füme sos, coleslaw", 190), ("Mac & Cheese", "Fırında üç peynirli", 85)],
 "kebapci": [("Adana Kebap", "Acılı, lavaş üstünde", 195), ("Kuzu Şiş", "Marine kuzu, pilavla", 225), ("Künefe", "Peynirli, kadayıflı", 95)],
 "deniz": [("Levrek Izgara", "Tam levrek, mevsim yeşillikleri", 245), ("Kalamar Tava", "Tartar sos ile", 130), ("Hamsi Tava", "Karadeniz usulü", 140)],
 "vegan": [("Buddha Bowl", "Kinoa, nohut, avokado", 115), ("Vegan Wrap", "Sebzeli, tahin soslu", 98), ("Detoks Suyu", "Yeşil elma, ıspanak, zencefil", 55)],
 "cafe": [("Cappuccino", "İtalyan espresso, sütlü köpük", 55), ("Cheesecake", "Yaban mersini soslu", 85), ("Kurabiye & Süt", "Çikolatalı, günlük", 60)],
 "kahve": [("Flat White", "Çift shot ristretto", 60), ("Cold Brew", "16 saat demlenmiş", 65), ("Muzlu Kek", "Cevizli, tarçınlı", 58)],
 "cocktailbar": [("Espresso Martini", "Vodka, kahve likörü", 150), ("Negroni", "Gin, campari, vermut", 145), ("Moscow Mule", "Vodka, zencefil birası", 140)],
 "icecek": [("Mojito", "Nane, lime, beyaz rom", 135), ("Piña Colada", "Rom, ananas, hindistan cevizi", 145), ("Gin Tonic", "Fesleğenli, pink pepper", 130)],
 "sarap": [("Öküzgözü", "Türk kırmızısı, 2019", 320), ("Chardonnay", "Beyaz, meyvemsi", 280), ("Prosecco", "Kadeh, İtalya", 190)],
 "birahane": [("Craft IPA", "Yerel üretim, acımsı", 95), ("Pilsner", "Buz gibi kadeh", 75), ("Jumbo Sosis", "Karamelize soğanlı, hardallı", 110)],
 "pub": [("Fish & Chips", "Bira hamurunda, tartar sos", 165), ("Bangers & Mash", "Sosis, patates püresi", 150), ("Shepherd's Pie", "Kuzu kıymalı güveç", 160)],
 "gastro-pub": [("Dana Yanak", "12 saat yavaş pişmiş, trüflü püre", 240), ("Gurme Burger", "Wagyu, aged cheddar", 285), ("Domuz Pirzola", "Elmalı, ada çaylı", 220)],
 "nargile": [("Çift Elma", "Klasik, yumuşak çekim", 180), ("Nane Limon", "Serinletici karışım", 175), ("Karpuz-Mentol", "Yaz karışımı", 185)],
 "firin": [("Simit & Poğaça", "Tereyağlı, susamlı", 35), ("Su Böreği", "Ev yapımı, beyaz peynirli", 70), ("Tahinli Çörek", "Akşam çıkımı", 45)],
 "dondurma": [("2 Top Külah", "Fıstık ve çilek", 65), ("Sundae", "Sıcak çikolata, fındık", 95), ("Affogato", "Vanilyalı, espresso dökme", 85)],
 "dondurma-kamyonu": [("Dondurma Sandviçi", "Kurabiye arası", 55), ("Gökkuşağı Konili", "Renkli sprinkler", 60), ("Banana Split", "Klasik, fıstık ezmeli", 85)],
 "su-barı": [("Yeşil Enerji", "Ispanak, elma, zencefil", 68), ("Gün Batımı", "Havuç, portakal, zencefil", 66), ("Acai Bowl", "Muz, granola, dut", 95)],
 "otel": [("Sezar Salata", "Klasik, parmesan krokan", 145), ("Dana Bonfile", "Trüf sos, ızgara sebze", 385), ("Crème Brûlée", "Bourbon vanilyalı", 95)],
 "dugun": [("Aperitif Tabağı", "Mezeler, zeytinyağlılar", 220), ("Kuzu Külbastı", "Düğün pilavı ile", 340), ("Düğün Pastası", "Beyaz çikolatalı", 120)],
 "burger": [("Double Smash", "2 köfte, cheddar, turşu", 165), ("Trüff Burger", "Trüflü mayonez, mozzarella", 185), ("Süslü Patates", "Trüff yağı, parmesan", 75)],
 "kahvalti": [("Serpme Kahvaltı", "2 kişilik, 18 çeşit", 320), ("Menemen", "Domates, biber, beyaz peynir", 95), ("Mıhlama", "Rize usulü eritme", 110)],
 "tatli": [("San Sebastian", "Yanık cheesecake", 120), ("Fıstıklı Baklava", "Antep fıstığı, şerbet", 105), ("Profiterol", "Sıcak çikolata soslu", 90)],
 "tatlici": [("Şöbiyet", "Antep fıstığı, kaymak", 115), ("Trileçe", "Üç sütlü, karamelli", 95), ("Fıstıklı Kadayıf", "Buz gibi", 100)],
 "yilbasi": [("Izgara Hindi", "Kestaneli, cranberry soslu", 320), ("Fırın Sebzeler", "Balzamik, kekikli", 140), ("Yule Log", "Çikolatalı rulo pasta", 130)],
 "hasat": [("Kabak Çorbası", "Kavrulmuş kabak, çekirdek", 75), ("Mantar Risotto", "Orman mantarları, parmesan", 165), ("Elmalı Strudel", "Tarçınlı, dondurmali", 85)],
 "gunun-ozeli": [("Günün Çorbası", "Mevsime göre değişir", 60), ("Kasap Tabağı", "Karışık ızgara, 2 kişilik", 420), ("Ev Limonatası", "Naneli, buz gibi", 40)],
 "modern": [("Dana Tartar", "Yumurta sarısı, ekşi maya", 225), ("Balık Ceviche", "Lime, turşu soğan", 185), ("İncirli Tatlı", "Aktif kömür, taze incir", 110)],
 "catering": [("Meze Tabağı", "10-15 kişiye, karışık", 850), ("Izgara Tabağı", "20 kişilik, karışık et", 2400), ("Tatlı Büfesi", "Karışık, 30 kişilik", 1500)],
}

count = 0
for pid, items in EXTRA.items():
    m = re.search(r'\{ id: "%s",.*?items: \[\n' % re.escape(pid), src, re.S)
    if not m:
        sys.exit("preset bulunamadi: " + pid)
    insert_at = m.end()
    block = "".join('      { name: "%s", desc: "%s", price: %d },\n' % (n, d, p) for n, d, p in items)
    src = src[:insert_at] + block + src[insert_at:]
    count += 1

io.open(PATH, "w", encoding="utf-8", newline="\n").write(src)
print("guncellenen preset:", count)
