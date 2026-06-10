{
    'name': 'Dynamic Column Gantt Chart',
    'summary': 'Add dynamic additional columns to Odoo 14 Enterprise Web Gantt View',
    'description': """
        Dynamic Column Gantt Chart is a custom module for Odoo 14 Enterprise that extends the standard Web Gantt View by adding support for dynamic additional columns.
        This module allows users to display more business information directly in the Gantt View, such as images, quantities, volumes, status, progress values, and other related fields.
        It also provides several customization options including column visibility, column width, merged headers, decimal precision, value alignment, default collapsed groups, and custom displayed values inside the Gantt bar.
        This module is suitable for manufacturing planning, production reporting, project scheduling, maintenance planning, delivery monitoring, and other timeline-based business processes.
    """,
    'version': '14.0',
    'category': 'Gantt',
    'sequence': 40,
    'author': 'M. Kholil Lutfi S. Kom',
    'depends': ['base', 'web', 'web_gantt'],
    'data': [
        'views/web_gantt_templates.xml'
    ],
    'installable': True,
    'license': 'OEEL-1',

}
