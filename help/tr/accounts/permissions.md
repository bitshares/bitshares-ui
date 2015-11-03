# İzinler

BitShares'de , her hesap ikiye ayrılır 

* **Etkin  İzin**: fonların yönetimi 
* **Sahip İzni**: hesap yönetimi.

Her ikisi de hesabınızın `İzinler` sekmesinde *yetkiler* ve *alt-sınır*'ın birlikte 
kullanılmasıyla belirlenebilir. İşlemin geçerli olması için *alt-sınır* ın geçilmesi 
gerekmektedir.

## Yetkililer

BitShares'de bir *yetkili*,  transfer veya alım-satım gibi işlemlere yetki veren bir veya 
daha çok sayıda kişiden oluşur.

Bir yetki , bir yada daha fazla sayıda hesap adı ve*ağırlık* 
çiftinden oluşur.

Geçerli bir işlem elde edebilmek için , imzalayan tarafların ağırlıklarının toplamı 
izinlerde belirlenmiş olan alt-sınırı geçiyor olması gerekir.  

# Örnekler

Birkaç örneğe bakarak kullanılan terminolojiye ve kullanım senaryolarına ışık tutalım. 
Aşağıda tanımlanmış etkin izinlerle yeni bir hesap oluşturulduğunu farz edelim. 
Dikkatinizi çekeriz , aynı şema sahip izinleri için de 
işe yarar. 

## (Düz) Çoklu-İmza

Düz çok-imzalı bir şema, işlemin geçerli olabilmesi için 'N' sayıda kişinin 
imzalamak zorunda olduğu 'M' sayıda kişiden oluşur. Şimdi biz, Bitshares'de, 'M' 
ve 'N' yerine *ağırlıklar* ve *alt-sınır*  kullanıyoruz. Şimdi göreceğimiz gibi tamamen 
aynı sonuca çok daha esnek bir şekilde varacağız.  

Gelin şöyle farz edelim , Alice, Bob, Charlie ve Dennis'in ortak fonları olsun . 
Aralarından sadece ikisinin hem-fikir olduğu geçerli bir işlem oluşturmayı isteyelim.
Dolayısıyla **4-ün-2-si** (M-in-N-i) şeması şöyle görünür : 

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

Alternatif olarak, bir 4-ün-3'ü şeması oluşturmak için biz ya ağırlıkları 17 ye indirebiliriz 
yada alt-sınırı 99%'a yükseltebiliriz. 

## (Düz) Esnek Çoklu-İmza

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

Şimdi, fonlara Alice ya tek bir arkadaşıyla yada  tüm üç arkadaşıyla birlikte ulaşma 
imkanına sahip olur.

## Çok-Basamaklı Esnek Çoklu-İmza

Gelin beraber basit bir çok-basamaklı anonim hesap kurulumuna göz atalım. Mali İşler 
Müdürü (MİM) ve onun için altında çalışan işte Vezne, Denetçi, Vergi Müdürü, Muhasebe vb. gibi 
departmanları olan bir şirkete bakıyor olalım. Şirketin bir de harcama ayrıcalıkları 
olsun isteyen bir CEO'su olsun. 
O zaman biz fonlar için yetkiyi şunlara göre oluştururuz :

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
| Alt-sınır:          | 51%    |

Bu şema şunlara izin verir :

*CEO'a fonları harcamaya
*Mali İşler Müdürüne fonları harcamaya
*Vezneyle birlikte Morakıp afonları harcamaya
*Denetçi yada Veznedar ile birlikte ya Vergi Müdürü yada Muhasabeci fonları 
  harcamaya.

Dolayısıyla görüldüldüğü gibi yetkilendirmeleri gelişigüzel derinlikte yayarak her türlü 
iş alanına uyacak esneklikte uygulamak mümkün.