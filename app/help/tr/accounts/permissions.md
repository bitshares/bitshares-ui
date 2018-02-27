# İzinler

BitShares'de , her hesap ikiye ayrılır 

* **Etkin  İzin**: fonların yönetimi ve
* **Sahip İzni**: hesap yönetimi.

Her ikisi de hesabınızın `İzinler` sekmesinde *yetkiler* ve *alt-sınır*'ın birlikte 
kullanılmasıyla belirlenebilir. İşlemin geçerli olması için *alt-sınır* ın geçilmesi 
gerekmektedir.

## Yetkililer

BitShares'de bir *yetkili*,  transfer veya alım-satım gibi işlemlere yetki veren bir veya 
daha çok sayıda kişiden oluşur.

Bir yetki , bir yada daha fazla sayıda hesap adı ve *ağırlık* 
çiftinden oluşur.

Geçerli bir işlem elde edebilmek için , imzalayan tarafların etki ağırlıklarının toplamı 
izinlerde belirlenmiş olan alt-sınırı geçiyor olması gerekir.  

# Örnekler

Birkaç örneğe bakarak kullanılan terminolojiye ve kullanım senaryolarına ışık tutalım. 
Aşağıda tanımlanmış etkin izinlerle yeni bir hesap oluşturulduğunu farz edelim. 
Dikkatinizi çekeriz , aynı şema sahip izinleri için de 
işe yarar. 

## (Düz) Çok-İmzalı

Düz çok-imzalı bir şema, işlemin geçerli olabilmesi için aralarından 'N' sayıda kişinin 
imzası gerekli  toplam 'M' sayıda kişiden oluşur. Şimdi biz, BitShares'de, 'M' 
ve 'N' yerine *ağırlıklar* ve *alt-sınır*  kullanıyoruz. Şimdi göreceğimiz gibi tamamen 
aynı sonuca çok daha esnek bir şekilde varacağız.  

Gelin şöyle farz edelim , Alice, Bob, Charlie ve Dennis'in ortak fonları olsun . 
Eğer yalnızca ikisi anlaşırlarsa geçerli olabilecek bir işlem oluşturmak istiyoruz .
Dolayısıyla **4-ün-2-si** (M-in-N-i) şeması şöyle görünür : 

| Hesap | Ağırlık | 
| ---------- | ------ | 
| Alice      | 33%    | 
| Bob        | 33%    | 
| Charlie    | 33%    | 
| Dennis     | 33%    | 
| ---------- | ------ | 
| Alt Sınır : | 51%    | 

Katılımcıların her birinin 33% etki ağırlığı var fakat alt sınır 51%  olarak ayarlanmış.
Dolayısıyla  işlemi geçerli kılmak için 4 kişiden sadece 2 sinin anlaşması yeterlidir.

Alternatif olarak, bir 4-ün-3'ü şeması oluşturmak için ya ağırlıkları 17% ye indirebiliriz 
yada alt-sınırı 99%'a yükseltebiliriz. 

## (Düz) Esnek Çok-İmzalı

Alt-sınır ve ağırlıklar sayesinde fonlarımızla şimdi daha esneğiz, yada daha doğrusu 
daha fazla *hakimiyetimiz* var. Mesela , farklı kişiler için ayrı ağırlıklar belirleyebiliriz.
Farzedelim ki Alice fonlarını çoklu-imza şeması kullanarak hırsızlığa karşı korumak 
istiyor fakat aynı zamanda arkadaşlarına da gereğinden fazla hakimiyet teslim etmek 
istemiyor. O zaman şuna benzer bir yetki oluşturuyoruz :

| Hesap | Ağırlık | 
| ---------- | ------ | 
| Alice      | 49%    |
| Bob        | 25%    |
| Charlie    | 25%    |
| Dennis     | 10%    |
| ---------- | ------ | 
| Alt Sınır : | 51%    |

Şimdi, fonlara Alice tek bir arkadaşıyla yada  tüm üç arkadaşıyla birlikte erişebilme 
imkanına sahip olur.

## Çok-Basamaklı Esnek Çoklu-İmza

Gelin beraber basit bir çok-basamaklı anonim hesap kurulumuna göz atalım. Mali İşler 
Müdürü (MİM) ve onun için altında çalışan Vezne, Denetçi, Vergi Müdürü, Muhasebe vb. gibi 
departmanları olan bir şirkete bakıyor olalım.  Bir de harcama ayrıcalıklarına sahip
olmayı  isteyen bir CEO'su olsun. 
O zaman biz fonlar için şunlara göre bir yetki oluştururuz :

| Hesap | Ağırlık | 
| ---------- | ------ | 
| CEO.ŞİRKET| 51%    |
| MİM.ŞİRKET| 51%    |
| ---------- | ------ | 
| Alt Sınır : | 51%    |

burada CEO.ŞİRKET ve MİM.ŞİRKET in kendilerine ait ayrı yetkileri var.  Mesela 
MİM.ŞİRKET hesabı şöyle olabilir :

| MİM.ŞİRKET         | Ağırlık |
| ------------------- | ------ |
| Müdür.ŞİRKET       | 51%    |
| Vezne.ŞİRKET   | 33%    |
| Denetçi.ŞİRKET  | 33%    |
| Vergi Müdürü.ŞİRKET | 10%    |
| Muhasebe.ŞİRKET  | 10%    |
| ------------------- | ------ |
| Alt-sınır :       | 51%    |

Bu şema fonların harcanabilmesi için  kişilere şöyle izinler verir :

* CEO  tek başına
* Mali İşler Müdürün tek başına 
*  Vezne ve Denetçi birlikte
* Denetçi veya Veznedar , Vergi Müdürü ve Muhasebeciyle birlikte 
  harcama.

Dolayısıyla görüldüldüğü gibi yetkilendirmeleri gelişigüzel derinlikte yayarak her türlü 
iş alanına uyacak esneklikte uygulamak mümkün.
