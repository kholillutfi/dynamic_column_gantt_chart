from odoo import models, fields, _
from lxml import etree

from asyncio.log import logger

GANTT_VALID_ATTRIBUTES = set([
    'date_start',
    'date_stop',
    'default_scale',
    'class',
    'js_class',
    'form_view_id',
    'progress',
    'consolidation',
    'consolidation_max',
    'consolidation_exclude',
    'string',
    'create',
    'on_create',
    'cell_create',
    'edit',
    'delete',
    'plan',
    'default_group_by',
    'dynamic_range',
    'display_unavailability',
    'disable_drag_drop',
    'total_row',
    'collapse_first_level',
    'offset',
    'scales',
    'thumbnails',
    'precision',
    'color',
    'decoration-secondary',
    'decoration-success',
    'decoration-info',
    'decoration-warning',
    'decoration-danger',
    'sample',
    'default_collapse_group'
])

class View(models.Model):
    _inherit = 'ir.ui.view'

    def _validate_tag_gantt(self, node, name_manager, node_info):
        templates_count = 0
        for child in node.iterchildren(tag=etree.Element):
            if child.tag == 'templates':
                if not templates_count:
                    templates_count += 1
                else:
                    msg = _('Gantt view can contain only one templates tag')
                    self.handle_view_error(msg)
            elif child.tag != 'field':
                msg = _('Gantt child can only be field or template, got %s')
                self.handle_view_error(msg % child.tag)

        default_scale = node.get('default_scale')
        if default_scale:
            if default_scale not in ('day', 'week', 'month', 'year'):
                self.handle_view_error(_("Invalid default_scale '%s' in gantt", default_scale))
        attrs = set(node.attrib)
        if not 'date_start' in attrs:
            msg = _("Gantt must have a 'date_start' attribute")
            self.handle_view_error(msg)

        if not 'date_stop' in attrs:
            msg = _("Gantt must have a 'date_stop' attribute")
            self.handle_view_error(msg)

        remaining = attrs - GANTT_VALID_ATTRIBUTES
        if remaining:
            logger.info(GANTT_VALID_ATTRIBUTES)
            msg = _("Invalid attribute%s (%s) in gantt view. Attributes must be in (%s)")
            self.handle_view_error(msg % ('s' if len(remaining) > 1 else '', ','.join(remaining), ','.join(GANTT_VALID_ATTRIBUTES)))