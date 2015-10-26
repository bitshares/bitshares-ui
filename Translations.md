Translating Graphene 
====================

## Continuous localization

* **Graphene's GUI** repository is bridged with [**Transifex translation platform**](https://www.transifex.com/bitshares) for continuous localization.

* Source language files are updated in real time when added or modified in Graphene repository. 
Tanslators can choose to be notified on changes.

* Once a translation is completed, and reviewed by its [**Language Coordinator**](http://docs.transifex.com/introduction/#user-roles-in-transifex), 
it is automatically pushed to an intermediate repository where the code's syntax preservation is inspected.

* When all resources for a given language are translated and reviewed they are pushed to the main repository, to be included in the next release.

* **You can join the translation team** by requesting resources and language in which you want to start translating, at **https://transifex.com/bitshares**.
You can create an account for free or simply log in with your Github or Gmail account.

* [**Using the Transifex Web Editor is easy**](http://docs.transifex.com/tutorials/txeditor/) 


## Instructions:

###### For a translation to be completed we have work on two different kind of files. There's one single file with all the short strings that belongs to the interface itself, and the markdown help files that are embedded on many sections from the interface.
###### As both resources have different formats they are divided in two Transifex projects:

### Main interface strings

**https://www.transifex.com/bitshares/graphene-ui**

* This file has JSON line key/value paires. Only values must be translated (just the text between double quotes). 

* Some values have placeholders with the format "%(variable)s", those should not be translated. They can be moved inside a string if needed for better syntax but they should not be modified.

* The best practis is to use the [**Copy source string button**](http://docs.transifex.com/tutorials/txeditor/#4-translation-time) and edit just de translatable text.

### Help content files

**https://www.transifex.com/bitshares/graphene-ui-help**

This are Github markdown pages. This makes translated content highly portable, ready to use on other interfacs and websites.
Actually Transifex does not support markdown format so we have to work with plain text here too. That means each line is considered as a string.
It can be a little annoying but worth it for the continuous integration.

##### Two simple rules:

* To preserve markdown syntax all symbols must remain where they are.
Here again, when markdown formating is present, using the [**Copy source string button**](http://docs.transifex.com/tutorials/txeditor/#4-translation-time) helpful.

* Link names can be translated buy we have to preserve paths and filenames. Links looks like:
[translatable link name](non-translatable/path-to/filename.md).
