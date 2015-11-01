# BitVarlık Kısa Satışı

BTS'le temasınızı arttırmak ve USD,EUR,GOLD gibi BitVarlıklara likidite sağlamak için 
bu BitVarlıkları ağdan *ödünç* alabilir ve *kısa satabilirsiniz*. Prosedürü burada kısaca 
anlatacağız.

## Ödünç Alma

BitShares ağının herhangi bir miktarda BitVarlığı piyasaya sürmesi ve yeterli teminat 
karşılığında katılımcılara borç vermesi mümkündür. 

 * *uzlaşma fiyatı* : 1 BTS in dış borsalarda alıp-satılırkenki fiyatı.
 **idame teminat oranı* (MCR) : Tanıklar tarafından zorunlu minimum teminat oranı olarak belirlenen oran
 **maksimum kısa sıkıştırma oranı* (MSQR) : Tanıklar tarafından kısaların kısa sıkıştırmalara karşı nereye kadar korunacaklarını belirleyen oran. 
 **kısa sıkıştırmadan korunma* (SQP) : Marjin pozisyonuna ödettirilebilecek en yüksek  
 **çağrı fiyatı* (cp):   Kısa/ödünç pozisyonlarının marjin çağrıldığı fiyat.  

### Marjin Çağrısı ( Teminat Tamamlama Çağrısı)

BitShares ağı , ödünç aldığı bitVarlığın karşılığında yeterince teminatı bulunmayan 
pozisyonları teminatı tamamlamaları için çağırabilir. Marjin çağrısı , en yüksek alış fiyat 
teklifinin *çağrı fiyatından* az , ve *SQP* dan büyük olduğu herhangi bir anda 
meydana gelebilir.
Marjin pozisyonu, teminatı satın almaya verilen en yüksek teklifin çağrı 
fiyatından(x/BTS) daha düşük olduğu anda teminatı zorla sattırılır.

    SQP =  uzlaşma fiyatı / MSQR
    çağrı fiyatı = BORÇ / TEMİNAT * MCR

Marjin çağrısı teminatı alır , ödünç alınmış bitVarlık hisselerinin SQP ya kadarki kısmını
piyasa fiyatından satın alır ve pozisyonu kapar. Teminattan geri kalan BTS müşteriye 
iade edilir.

### Hesap görme

Her bitVarlık sahibi istediği zaman *adil bir fiyattan* hesap görmeyi talep edebilir.
Hesap görme işlemi, ödünç/kısa pozisyonlarını en düşük teminat oranıyla kapar ve 
hesap görmek üzere teminatı satar.

## Satış

BitVarlık ödünç aldıktan sonra, ilgili herhangi bir piyasada alıcının ödemek istediği bir 
fiyattan satılabilir . Bu aşamayla ,  kısa-satış tamamlanmış olur ve o bitVarlık da kısa 
olursunuz.

## Teminat Oranı Güncellermesi

Ödünç/kısa pozisyonu tutan kişi , herhangi bir zamanda , piyasa 
davranışını esnek bir biçimde ayarlamak için teminat oranını değiştirebilir. Eğer 
teminat oranı arttırılırsa , ilave miktarda BTS teminat olarak kilit altına alınır, teminat 
oranının düşürülmesi ise tekabül eden miktarda BitVarlığın ağa geri ödenmesini 
gerektirir.

## Kapamak

Ödünç/kısa pozisyonunu kapamak için , bir kimse BitShares ağına teslim 
etmek üzere o Bitvarlığın ödünç alınan miktarının elinde bulunması gerekir. Ondan 
sonra , BitVarlıklar ilgili arz stoğundan düşer ve teminat serbest bırakılıp sahibine geri 
verilir.