# Sample configuration
# http://askubuntu.com/questions/12917/how-to-send-mail-from-the-command-line
# /etc/ssmtp/ssmtp.conf

from=${1?email from}
to=${2?email to}
token=${3?token}
token_url=${4?token url}
subject=${5?email subject}

cat<<EndOfMail | ssmtp "$to"
To: $to
From: $from
Subject: $subject
Date: $(date)
Content-Type: text/html

<p>Click on the link to validate your email.</p>
<p>${token_url}</p>
EndOfMail
