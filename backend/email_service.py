"""
Smart Rehab - Email Service (Gmail SMTP)
Configure in config.py:
  EMAIL_FROM     = 'your@gmail.com'
  EMAIL_PASSWORD = 'xxxx xxxx xxxx xxxx'  (App password from myaccount.google.com/apppasswords)
  EMAIL_ADMIN    = 'admin@smartrehab.tn'
"""
import smtplib, os, re, threading
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText
from email.mime.base      import MIMEBase
from email                import encoders
from datetime             import datetime

EMAIL_FROM     = os.environ.get('EMAIL_FROM',     'smartrehab.centre@gmail.com')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
EMAIL_ADMIN    = os.environ.get('EMAIL_ADMIN',    'admin@smartrehab.tn')
CENTRE_NAME    = 'Smart Rehab & Green Center'
SMTP_HOST      = 'smtp.gmail.com'
SMTP_PORT      = 587
EMAIL_ENABLED  = bool(EMAIL_PASSWORD)


def _send(to, subject, html, attachment_path=None):
    if not EMAIL_ENABLED:
        print('[EMAIL DEMO] To:', to, '| Subject:', subject)
        return True

    def worker():
        try:
            recipients = [to] if isinstance(to, str) else to
            msg = MIMEMultipart('alternative')
            msg['From']    = CENTRE_NAME + ' <' + EMAIL_FROM + '>'
            msg['To']      = ', '.join(recipients)
            msg['Subject'] = subject
            plain = re.sub(r'<[^>]+>', '', html.replace('<br>', '\n').replace('</p>', '\n'))
            msg.attach(MIMEText(plain, 'plain', 'utf-8'))
            msg.attach(MIMEText(html,  'html',  'utf-8'))
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment; filename="' + os.path.basename(attachment_path) + '"')
                msg.attach(part)
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(EMAIL_FROM, EMAIL_PASSWORD)
                server.sendmail(EMAIL_FROM, recipients, msg.as_string())
            print('[EMAIL OK] ->', recipients, '|', subject)
        except Exception as e:
            print('[EMAIL ERROR]', e)

    threading.Thread(target=worker, daemon=True).start()
    return True


def _template(title, body, cta_text=None, cta_link=None):
    cta = ''
    if cta_text:
        link = cta_link or '#'
        cta = '<div style="text-align:center;margin:28px 0"><a href="' + link + '" style="background:#40916C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">' + cta_text + '</a></div>'

    year = datetime.now().year
    return (
        '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>' + title + '</title></head>'
        '<body style="margin:0;padding:0;background:#F0F4F0;font-family:Arial,sans-serif">'
        '<div style="max-width:600px;margin:0 auto;padding:32px 16px">'
        '<div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">'
        '<p style="font-size:30px;margin:0 0 8px">🌿</p>'
        '<h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Smart Rehab &amp; Green Center</h1>'
        '<p style="color:rgba(255,255,255,.65);font-size:12px;margin:4px 0 0">Centre de rehabilitation innovant · Tunisie</p>'
        '</div>'
        '<div style="background:#fff;border-radius:0 0 16px 16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">'
        '<h2 style="color:#1B4332;font-size:22px;font-weight:700;margin:0 0 16px">' + title + '</h2>'
        '<div style="color:#374151;font-size:14px;line-height:1.8">' + body + '</div>'
        + cta +
        '<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0">'
        '<p style="font-size:11px;color:#9CA3AF;text-align:center;margin:0">'
        '&copy; ' + str(year) + ' Smart Rehab &amp; Green Center · Tunisie<br>'
        'contact@smartrehabgreen.tn · +216 71 XXX XXX'
        '</p>'
        '</div></div></body></html>'
    )


# 1. Confirmation inscription
def send_inscription_confirmation(prenom, nom, email, situation, urgent=False):
    subject = 'Votre demande d\'admission - Smart Rehab'
    if urgent:
        subject = '[URGENT] ' + subject

    urgent_block = ''
    if urgent:
        urgent_block = (
            '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-bottom:16px">'
            '<p style="color:#DC2626;font-weight:700;margin:0">Votre demande a ete marquee URGENTE</p>'
            '<p style="color:#7F1D1D;font-size:12px;margin:4px 0 0">Notre equipe vous contactera en priorite.</p>'
            '</div>'
        )

    date_str = datetime.now().strftime('%d/%m/%Y a %H:%M')
    body = (
        urgent_block +
        '<p>Bonjour <strong style="color:#1B4332">' + prenom + ' ' + nom + '</strong>,</p>'
        '<p>Nous avons bien recu votre demande d\'admission au <strong>Smart Rehab &amp; Green Center</strong>.</p>'
        '<div style="background:#F0FDF4;border-left:4px solid #40916C;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0">'
        '<p style="color:#065F46;font-weight:700;margin:0 0 6px">Recapitulatif</p>'
        '<p style="margin:2px 0;color:#374151"><strong>Nom :</strong> ' + prenom + ' ' + nom + '</p>'
        '<p style="margin:2px 0;color:#374151"><strong>Email :</strong> ' + email + '</p>'
        '<p style="margin:2px 0;color:#374151"><strong>Situation :</strong> ' + situation + '</p>'
        '<p style="margin:2px 0;color:#374151"><strong>Date :</strong> ' + date_str + '</p>'
        '</div>'
        '<p>Notre equipe vous contactera dans les <strong>48 heures</strong>.</p>'
        '<p>Avec bienveillance,<br><strong>L\'equipe du Smart Rehab &amp; Green Center</strong></p>'
    )
    return _send(email, subject, _template('Demande d\'admission recue', body))


# 2. Approbation
def send_inscription_approved(prenom, nom, email, code_resident=None):
    code_block = ''
    if code_resident:
        code_block = '<p style="margin:4px 0;color:#374151"><strong>Code resident :</strong> <span style="background:#D1FAE5;padding:2px 8px;border-radius:4px;font-weight:700;color:#065F46">' + code_resident + '</span></p>'

    date_str = datetime.now().strftime('%d/%m/%Y')
    body = (
        '<p>Bonjour <strong style="color:#1B4332">' + prenom + ' ' + nom + '</strong>,</p>'
        '<p>Votre demande d\'admission a ete <strong style="color:#065F46">approuvee</strong> !</p>'
        '<div style="background:#F0FDF4;border-left:4px solid #40916C;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0">'
        '<p style="color:#065F46;font-weight:700;margin:0 0 6px">Admission confirmee</p>'
        + code_block +
        '<p style="margin:4px 0 0;color:#374151"><strong>Date :</strong> ' + date_str + '</p>'
        '</div>'
        '<p>Un membre de notre equipe vous contactera pour organiser votre rendez-vous d\'accueil.</p>'
        '<p>Bienvenue dans notre famille,<br><strong>L\'equipe du Smart Rehab &amp; Green Center</strong></p>'
    )
    return _send(email, 'Votre admission est confirmee - Smart Rehab', _template('Admission approuvee !', body))


# 3. Refus
def send_inscription_refused(prenom, nom, email, raison=''):
    raison_block = ''
    if raison:
        raison_block = '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin:16px 0"><p style="color:#7F1D1D;margin:0"><strong>Motif :</strong> ' + raison + '</p></div>'

    body = (
        '<p>Bonjour <strong style="color:#1B4332">' + prenom + ' ' + nom + '</strong>,</p>'
        '<p>Apres examen de votre dossier, nous ne sommes pas en mesure de donner suite a votre demande pour le moment.</p>'
        + raison_block +
        '<p>Nous vous encourageons a contacter notre equipe par telephone pour discuter de votre situation.</p>'
        '<p>Cordialement,<br><strong>L\'equipe du Smart Rehab &amp; Green Center</strong></p>'
    )
    return _send(email, 'Votre demande d\'admission - Smart Rehab', _template('Concernant votre demande', body))


# 4. Alerte IoT
def send_iot_alert(resident_code, resident_name, alert_type, message, severity='medium', staff_emails=None):
    if not staff_emails:
        staff_emails = [EMAIL_ADMIN]

    sev_map = {
        'high':   ('#FEE2E2', '#991B1B', '#DC2626', 'CRITIQUE'),
        'medium': ('#FEF3C7', '#92400E', '#D97706', 'MOYEN'),
        'low':    ('#D1FAE5', '#065F46', '#059669', 'BAS'),
    }
    bg, text_dark, text_med, sev_label = sev_map.get(severity, sev_map['medium'])
    icon = '🚨' if severity == 'high' else '⚠️' if severity == 'medium' else '✅'
    date_str = datetime.now().strftime('%d/%m/%Y a %H:%M:%S')

    urgent_block = ''
    if severity == 'high':
        urgent_block = (
            '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-bottom:16px">'
            '<p style="color:#991B1B;font-weight:700;margin:0">Action immediate requise</p>'
            '<p style="color:#7F1D1D;font-size:13px;margin:6px 0 0">Verifiez immediatement l\'etat du resident.</p>'
            '</div>'
        )

    body = (
        '<div style="background:' + bg + ';border:2px solid ' + text_med + ';border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">'
        '<p style="font-size:28px;margin:0">' + icon + '</p>'
        '<p style="color:' + text_dark + ';font-size:18px;font-weight:700;margin:6px 0 0">Alerte ' + sev_label + '</p>'
        '</div>'
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">'
        '<tr style="background:#F9FAFB"><td style="padding:10px 14px;font-weight:700;color:#374151;border-bottom:1px solid #E5E7EB;width:35%">Resident</td><td style="padding:10px 14px;color:#111827;border-bottom:1px solid #E5E7EB">' + resident_name + ' (' + resident_code + ')</td></tr>'
        '<tr><td style="padding:10px 14px;font-weight:700;color:#374151;border-bottom:1px solid #E5E7EB">Type</td><td style="padding:10px 14px;color:#111827;border-bottom:1px solid #E5E7EB">' + alert_type + '</td></tr>'
        '<tr style="background:#F9FAFB"><td style="padding:10px 14px;font-weight:700;color:#374151;border-bottom:1px solid #E5E7EB">Message</td><td style="padding:10px 14px;color:#111827;border-bottom:1px solid #E5E7EB"><strong>' + message + '</strong></td></tr>'
        '<tr><td style="padding:10px 14px;font-weight:700;color:#374151;border-bottom:1px solid #E5E7EB">Severite</td><td style="padding:10px 14px;border-bottom:1px solid #E5E7EB"><span style="background:' + bg + ';color:' + text_dark + ';padding:3px 10px;border-radius:100px;font-size:12px;font-weight:700">' + sev_label + '</span></td></tr>'
        '<tr style="background:#F9FAFB"><td style="padding:10px 14px;font-weight:700;color:#374151">Date / Heure</td><td style="padding:10px 14px;color:#111827">' + date_str + '</td></tr>'
        '</table>'
        + urgent_block +
        '<p style="color:#6B7280;font-size:12px">Alerte generee automatiquement par le systeme IoT ESP32.</p>'
    )

    subj_prefix = 'URGENT IoT' if severity == 'high' else 'Alerte IoT'
    subject = subj_prefix + ' - ' + resident_code + ' : ' + message[:50]
    return _send(staff_emails, subject, _template('Alerte IoT - ' + resident_name, body))


# 5. Rapport mensuel
def send_monthly_report(admin_email, stats, attachment_path=None):
    month = datetime.now().strftime('%B %Y')

    def row(label, value, color='#1B4332'):
        return '<tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #E5E7EB">' + label + '</td><td style="padding:10px 14px;text-align:right;font-weight:700;color:' + color + ';border-bottom:1px solid #E5E7EB">' + str(value) + '</td></tr>'

    taux = stats.get('taux_realisation', 0)
    attachment_note = ''
    if attachment_path:
        attachment_note = '<p style="margin-top:16px;color:#374151">Le rapport CSV est joint a cet email.</p>'

    body = (
        '<p>Bonjour,</p>'
        '<p>Voici le rapport mensuel du <strong>Smart Rehab &amp; Green Center</strong> pour <strong>' + month + '</strong>.</p>'
        '<h3 style="color:#1B4332;font-size:16px;margin:20px 0 10px">Residents</h3>'
        '<table style="width:100%;border-collapse:collapse">'
        + row('Total residents', stats.get('total_residents', 0))
        + row('Residents actifs', stats.get('actifs', 0), '#065F46')
        + row('Residents sortis', stats.get('sortis', 0), '#1E40AF')
        + row('Progression moyenne', str(stats.get('avg_progress', 0)) + '%', '#40916C')
        + '</table>'
        '<h3 style="color:#1B4332;font-size:16px;margin:20px 0 10px">Seances</h3>'
        '<table style="width:100%;border-collapse:collapse">'
        + row('Seances planifiees', stats.get('sessions_planifiees', 0))
        + row('Seances realisees', stats.get('sessions_realisees', 0), '#065F46')
        + row('Taux de realisation', str(taux) + '%', '#40916C')
        + '</table>'
        '<h3 style="color:#1B4332;font-size:16px;margin:20px 0 10px">Inscriptions</h3>'
        '<table style="width:100%;border-collapse:collapse">'
        + row('Nouvelles demandes', stats.get('new_registrations', 0))
        + row('Admissions approuvees', stats.get('approved', 0), '#065F46')
        + row('Demandes refusees', stats.get('refused', 0), '#991B1B')
        + '</table>'
        + attachment_note +
        '<br><p style="color:#6B7280;font-size:12px">Rapport genere le ' + datetime.now().strftime('%d/%m/%Y a %H:%M') + '</p>'
    )

    return _send(admin_email, 'Rapport mensuel ' + month + ' - Smart Rehab', _template('Rapport mensuel - ' + month, body), attachment_path)


# 6. Test email
def send_test_email(to_email):
    date_str = datetime.now().strftime('%d/%m/%Y a %H:%M')
    body = (
        '<p>Bonjour,</p>'
        '<p>Ce message confirme que la configuration email du <strong>Smart Rehab &amp; Green Center</strong> fonctionne correctement.</p>'
        '<div style="background:#F0FDF4;border:1px solid #6EE7B7;border-radius:8px;padding:14px;margin:16px 0;text-align:center">'
        '<p style="color:#065F46;font-weight:700;font-size:18px;margin:0">Configuration Gmail OK !</p>'
        '<p style="color:#047857;font-size:12px;margin:6px 0 0">Envoye le ' + date_str + '</p>'
        '</div>'
        '<table style="width:100%;border-collapse:collapse;font-size:13px">'
        '<tr><td style="padding:6px 0;color:#6B7280">Serveur SMTP :</td><td style="font-weight:600;color:#374151">' + SMTP_HOST + ':' + str(SMTP_PORT) + '</td></tr>'
        '<tr><td style="padding:6px 0;color:#6B7280">Expediteur :</td><td style="font-weight:600;color:#374151">' + EMAIL_FROM + '</td></tr>'
        '<tr><td style="padding:6px 0;color:#6B7280">Destinataire :</td><td style="font-weight:600;color:#374151">' + to_email + '</td></tr>'
        '</table>'
    )
    return _send(to_email, 'Test email - Smart Rehab Configuration OK', _template('Test de configuration email', body))
