# Yetkiler

BitShares'de , her hesap ikiye ayrılır 

* **Etkin  Yetki**: fonların yönetimi 
* **Sahip Yetkisi**: hesap yönetimi.

Her ikisi de hesabınızın 'Yetkiler' sekmesi içinde *merciler* (aşağıda)
  ve bir işlemin geçerli sayılabilmesi için aşılması gerekli  olan *eşik*  kullanılarak 
belirtilebilir.

## Merciler

BitShares'de bir *merci*,  transfer veya alım-satım gibi işlemleri yetkilendiren bir veya 
daha çok sayıda kişiden oluşur.

Bir merci , *ağırlığı* olan bir veya 
birçok hesap adı çiftinden oluşur.

Geçerli bir işlem elde edebilmek için , tarafların imzalanmasından gelen ağırlıkların 
toplamı yetkilerde belirlenen alt sınırı aşması gerekmektedir.

# Örnekler

Birkaç örneğe bakarak kullanılan terminolojiye ve kullanım senaryolarına ışık tutalım. 
Aşağıda verilen etkin yetkilere sahip yeni bir hesap oluşturulduğunu farz 
ediyoruz.  Aynı tertibin aynı zamanda sahip yetkileri için de aynı şekilde işe yaradığına 
dikkatinizi  çekeriz!

## (Düz) Çoklu-İmza

Düz çok-imzalı bir tertip, işlemin geçerli olabilmesi için 'N' sayıda teşekkülün 
imzalamak zorunda olduğu 'M' sayıda teşekkülden oluşur. Şimdi biz, Bitshares'de, 'M' 
ve 'N' yerine *ağırlıklar* ve *alt-sınır*  kullanıyoruz. Şimdi göreceğimiz gibi tamamen 
aynı sonuca çok daha esnek bir şekilde varacağız.  

Gelin şöyle farz edelim , Alice, Bob, Charlie ve Dennis in ortak fonları olsun . 
Aralarından sadece ikisinin hemfikir olduğu geçerli bir işlem oluşturmayı istiyoruz.
isteyelim. Dolayısıyla **4-ün-2-si** (M-in-N-i) tertibi şöyle görünür : 

| Hesap | Ağırlık | 
| ---------- | ------ | 
| Alice      | 33%    | 
| Bob        | 33%    | 
| Charlie    | 33%    | 
| Dennis     | 33%    | 
| ---------- | ------ | 
| Alt Sınır : | 51%    | 

Her dört katılımcının 33% ağırlığı var fakat alt sınır 51%  olarak ayarlanmış.
Dolayısıyla  işlemi geçerli kılmak için 4 kişiden sadece 2 sinin hemfikir olması gerekir.

Alternatif olarak, bir 4-ün-3'ü tertibi oluşturmak için biz ya ağırlıkları 17 ye indirebiliriz 
yada alt-sınırı 99%'a yükseltebiliriz. 

## (Düz) Esnek Çoklu-İmza

Alt-sınır ve ağırlıklar sayesinde fonlarımızla şimdi daha esneğiz, yada daha doğrusu 
daha fazla *hakimiyetimiz* var.  Mesela , farklı kişiler için ayrı ağırlıklar belirleyebiliriz.
Farzedelim ki Alice fonlarını çoklu-imza tertibi kullanarak hırsızlığa karşı korumak 
istiyor fakat aynı zamanda arkadaşlarına da gereğinden fazla hakimiyet teslim etmek 
istemiyor. O zaman şuna benzer bir yetkili oluşturuyoruz :

| Hesap | Ağırlık | 
| ---------- | ------ | 
| Alice      | 49%    |
| Bob        | 25%    |
| Charlie    | 25%    |
| Dennis     | 10%    |
| ---------- | ------ | 
| Alt Sınır : | 51%    |

Şimdi, fonlara Alice ya tek bir arkadaşıyla yada  tüm üç arkadaşıyla birlikte ulaşma 
imkanına sahip olur.

## Çok-Basamaklı Esnek Çoklu-İmza

Gelin beraber basit bir çok-basamaklı anonim hesap kurulumuna göz atalım. Mali İşler 
Müdürü (MİM) ve onun için altında çalışan işte Vezne, Denetçi, Vergi Müdürü, Muhasebe vb. gibi 
departmanları olan bir şirkete bakıyor olalım. Şirketin bir de harcama ayrıcalıkları 
olsun isteyen bir CEO'su olsun. 
O zaman biz fonlar için yetkiliyi şunlara göre oluştururuz :

| Hesap | Ağırlık | 
| ---------- | ------ | 
| CEO.ŞİRKET| 51%    |
| MİM.ŞİRKET| 51%    |
| ---------- | ------ | 
| Alt Sınır : | 51%    |

ve bu durumda CEO.ŞİRKET ve MİM.ŞİRKET in kendilerine ait ayrı yetkileri var.  Mesela 
MİM.ŞİRKET hesabı şöyle olabilir :

| MİM.ŞİRKET         | Ağırlık |
| ------------------- | ------ |
| Müdür.ŞİRKET       | 51%    |
| Vezne.ŞİRKET   | 33%    |
| Denetçi.ŞİRKET  | 33%    |
| Vergi Müdürü.ŞİRKET | 10%    |
| Muhasebe.ŞİRKET  | 10%    |
| ------------------- | ------ |
| Alt-sınır:          | 51%    |

Bu tertip şunlara izin verir :

*CEO'a fonları harcamaya
*Mali İşler Müdürüne fonları harcamaya
*Vezneyle birlikte Morakıp afonları harcamaya
*Denetçi yada Veznedar ile birlikte ya Vergi Müdürü yada Muhasabeci fonları 
  harcamaya.

Dolayısıyla görüldüldüğü gibi yetkilendirmeleri gelişigüzel derinlikte yayarak her türlü 
iş alanına uyacak esneklikte uygulamak mümkün.