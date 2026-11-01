import pdfplumber
from docx import Document
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import Table
from docx.text.paragraph import Paragraph

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def iter_block_items(doc):
    """Yield paragraphs and tables in the actual order they appear in the document."""
    parent_elm = doc.element.body
    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, doc)
        elif isinstance(child, CT_Tbl):
            yield Table(child, doc)

def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    full_text = []

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            full_text.append(block.text)
        elif isinstance(block, Table):
            for row in block.rows:
                for cell in row.cells:
                    full_text.append(cell.text)

    return "\n".join(full_text)