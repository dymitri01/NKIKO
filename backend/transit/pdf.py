import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generer_bordereau_pdf(lettre_voiture):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Bordereau de réception", styles["Title"]))
    elements.append(Spacer(1, 0.5 * cm))

    infos = [
        f"Numéro de lettre de voiture : {lettre_voiture.numero_lettre_voiture}",
        f"Numéro de BL : {lettre_voiture.numero_bl}",
        f"Client : {lettre_voiture.client.nom}",
        f"Transporteur : {lettre_voiture.transporteur.nom}",
        f"Chargeur : {lettre_voiture.chargeur.nom}",
        f"Chauffeur : {lettre_voiture.chauffeur}",
        f"Immatriculation : {lettre_voiture.immatriculation_camion}",
        f"Trajet : {lettre_voiture.trajet}",
        f"Pays de provenance : {lettre_voiture.pays_provenance}",
        f"Date d'arrivée : {lettre_voiture.date_arrivee}",
    ]
    for ligne in infos:
        elements.append(Paragraph(ligne, styles["Normal"]))
    elements.append(Spacer(1, 1 * cm))

    data = [["N° bille", "Contrat", "Essence", "Longueur (m)", "Diamètre (m)", "Volume (m³)"]]
    total = 0
    for colis in lettre_voiture.colis.select_related("contrat", "marchandise").all():
        data.append(
            [
                colis.numero_bille,
                colis.contrat.numero_contrat,
                colis.marchandise.nom,
                str(colis.longueur),
                str(colis.diametre),
                str(colis.volume),
            ]
        )
        total += colis.volume
    data.append(["", "", "", "", "Total", str(total)])

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f5233")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ]
        )
    )
    elements.append(table)

    doc.build(elements)
    return buffer.getvalue()
