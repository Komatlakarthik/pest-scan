'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change imageUrl column from VARCHAR(500) to LONGTEXT
    await queryInterface.changeColumn('reports', 'image_url', {
      type: Sequelize.TEXT('long'),
      allowNull: false,
      comment: 'Image URL or base64 data URI'
    });

    // Change overlayUrl column from VARCHAR(500) to LONGTEXT
    await queryInterface.changeColumn('reports', 'overlay_url', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      comment: 'Image with bounding boxes/heatmap'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert imageUrl back to VARCHAR(500)
    await queryInterface.changeColumn('reports', 'image_url', {
      type: Sequelize.STRING(500),
      allowNull: false
    });

    // Revert overlayUrl back to VARCHAR(500)
    await queryInterface.changeColumn('reports', 'overlay_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Image with bounding boxes/heatmap'
    });
  }
};
