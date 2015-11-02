Translating Graphene 
====================

## Continuous localization

* **Graphene's GUI** repository is bridged with [**Transifex translation platform**](https://www.transifex.com/bitshares) for continuous localization.

* Source language files are updated in real time when text is added or modified in Graphene's repository. 
Tanslators can choose to be notified on changes.

* Once a translation is completed, and reviewed by its [**Language Coordinator**](http://docs.transifex.com/introduction/#user-roles-in-transifex), 
it is automatically pushed to an intermediate repository where the code's syntax preservation is inspected.

* When all resources for a given language are translated and reviewed they are pushed to the main repository, to be included in the next release.

* **You can join the translation team** by requesting resources and language in which you want to participate at **https://transifex.com/bitshares**.
You can create an account for free or simply log in with your Github or Gmail account.

* [**Using the Transifex Web Editor is easy**](http://docs.transifex.com/tutorials/txeditor/) 


## Instructions:

###### For a translation to be completed we have to work on two different type of files. There's one single file with all the short strings that belongs to the interface itself, and on the other side the markdown help files that are embedded on many sections in the interface.
###### As both resources have different formats they are divided in two Transifex projects:

### Graphene User Interfase, main strings

**https://www.transifex.com/bitshares/graphene-ui**

#### **Two simple rules:**

1. This file has JSON style key/value pairs. Only values must be translated (justthe text between "double quotes"). 

2. Some values have placeholders with the format "%(variable)s", those should not be translated. They can be moved inside a string if needed for better grammar, but they should not be modified.

##### The best practice is to use the [**Copy source string button**](http://docs.transifex.com/tutorials/txeditor/#4-translation-time) and just replace de translatable text.
===

### Help content files

**https://www.transifex.com/bitshares/graphene-ui-help**

* These are Github markdown pages. This approach makes translated content highly portable, ready to use on many other  interfaces and websites.

* Actually Transifex does not support markdown format so we have to work with plain text here too. That means each line is parsed as one string. This can be a little annoying but it is worth for the sake of continuous integration.

#### **Two simple rules:**

1. To preserve markdown syntax all symbols must remain where they are: ###. [ ]  ( ) ** ** __ __ etc.
Here again, when markdown formating is present, using the [**Copy source string button**](http://docs.transifex.com/tutorials/txeditor/#4-translation-time) is very helpful to prevent mistakes.

2. Link names can be translated but we have to preserve paths and filenames. Links looks like this:
 ```
 [translatable link name](non-translatable/path-to/filename.md)
 ```
##### 100% translated and reviewed pages are instantly available at https://github.com/rngl4b/graphene-ui/tree/transifex/help
