# Alış-Satış

Bu sayfa DEX (dağıtık borsa)de kullanılan terimlerin nasıl yorumlanması gerektiği 
ve al-sat eşlerinin nasıl temsil edildiğine dair hızlı bir giriştir.

## Çiftler/Eşler

BitShares'de , neredeyse her aktif tüm diğer aktiflerle alınıp-satılabilirler. İki varlık 
seçmiş olduğumuz vakit , biz genelde *piyasa çifti* diye hitab ediyoruz. Mesela , 
USD'yi EUR'a karşı  USD:EUR çiftinde takas edebiliriz.

Tutarlı olmak adına , biz *temel* ve *kota* genel terimlerini kullanacağız ,
öyleki çiftler şöyle temsil edileceklerdir 

    *kota* : *temel*

ve mesela *temel* USD olursa ve *kota* da EUR olursa biz  bunu EUR:USD çifti olarak 
belirteceğiz

## Sipariş Defterleri

Sipariş defteri *ask* (istenilen satış fiyatı) ve *bid* (verilen alış teklif fiyatı) yanlarından 
oluşur. Alış-satış çiftlerin tercihen bir yönü olmadığından ters çevirilebilirler, aşağıdaki 
tabloda ask/bid ve her iki tarafın ilgili al/sat operasyonlarına genel bakış verilmiştir:

| Taraf   | Sat  | Al   | 
| ---------- | ------- | ------- |
| Ask        | *kota* | *temel*  |
| Bid        | *temel*  | *kota* |
| ---------- | ------- | ------- |

USD:EUR çiftinin bid tarafında olan EUR:USD çiftinin ask tarafında 
olacaktır. Tabiiki  fiyatlar kesir olarak temsil edileceğinden sonuçta her iki çift aynı 
olacaktır.

## Alış-Satış

Al-sat emri vermek için , formun taraflarından birini doldurmak 
gereklidir,  ya *ask*, yada *bid* tarafı ( *al* yada *sat* tarafı) . Satmak/almak için bir 
*fiyat* ve bir *miktar* belirlemeniz gerekecektir. Bu emrin maliyeti otomatik olarak 
hesaplanacaktır. 
Bu emrin verilmesi için ilave ücret gerekecektir.

Emir icra edildiğinde (biri teklifinizi sattığında/aldığında) , hesabınıza söz konusu 
varlıktan yatırılacaktır.

Yerine getirilmemiş emirler herhangi bir zamanda iptal edilebilirler.