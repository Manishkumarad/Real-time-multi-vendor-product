const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    hasNext: page * limit < (query.total || 0),
    hasPrev: page > 1,
    totalPages: Math.ceil((query.total || 0) / limit)
  };
};

const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      itemsPerPage: limit
    }
  };
};

const buildFilterQuery = (query, allowedFilters = {}) => {
  const filter = { isActive: true };

  Object.keys(allowedFilters).forEach(key => {
    if (query[key]) {
      const filterType = allowedFilters[key];
      
      switch (filterType) {
        case 'text':
          filter[key] = { $regex: query[key], $options: 'i' };
          break;
        case 'number':
          if (query[key].includes('-')) {
            const [min, max] = query[key].split('-').map(Number);
            filter[key] = {};
            if (!isNaN(min)) filter[key].$gte = min;
            if (!isNaN(max)) filter[key].$lte = max;
          } else {
            filter[key] = Number(query[key]);
          }
          break;
        case 'date':
          if (query[key].includes('-')) {
            const [startDate, endDate] = query[key].split('-');
            filter[key] = {};
            if (startDate) filter[key].$gte = new Date(startDate);
            if (endDate) filter[key].$lte = new Date(endDate);
          } else {
            filter[key] = new Date(query[key]);
          }
          break;
        case 'enum':
          if (Array.isArray(allowedFilters[key].values)) {
            filter[key] = { $in: query[key].split(',') };
          } else {
            filter[key] = query[key];
          }
          break;
        case 'objectId':
          filter[key] = query[key];
          break;
        default:
          filter[key] = query[key];
      }
    }
  });

  return filter;
};

const buildSortQuery = (query, allowedSortFields = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';
  
  if (!allowedSortFields.includes(sortBy)) {
    return { createdAt: -1 };
  }

  return {
    [sortBy]: sortOrder === 'desc' ? -1 : 1
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationResponse,
  buildFilterQuery,
  buildSortQuery
};
