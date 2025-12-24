export interface WebflowSite {
    id: string
    displayName: string
    shortName: string
    previewUrl: string
    customDomains?: Array<{
        id: string
        url: string
    }>
}

export interface WebflowCollection {
    id: string
    displayName: string
    slug: string
    fields?: Array<{
        id: string
        displayName: string
        slug: string
        type: string
    }>
}

export interface WebflowItem {
    id: string
    isDraft: boolean
    isArchived: boolean
    lastPublished?: string
    lastUpdated?: string
    createdOn?: string
    fieldData: {
        name?: string
        title?: string
        slug?: string
        [key: string]: any
    }
}

export class WebflowClient {
    private token: string
    private baseUrl = 'https://api.webflow.com/v2'

    constructor(token: string) {
        this.token = token
    }

    private async fetch(endpoint: string, options: RequestInit = {}) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/json',
                ...options.headers,
            },
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('Webflow API Error Body:', errorText)
            throw new Error(`Webflow API Error: ${res.status} ${res.statusText} - ${errorText}`)
        }

        const text = await res.text()
        return text ? JSON.parse(text) : {}
    }

    async listSites(): Promise<WebflowSite[]> {
        const data = await this.fetch('/sites')
        return data.sites || []
    }

    async listCollections(siteId: string): Promise<WebflowCollection[]> {
        const data = await this.fetch(`/sites/${siteId}/collections`)
        return data.collections || []
    }

    async getCollection(collectionId: string): Promise<WebflowCollection> {
        return this.fetch(`/collections/${collectionId}`)
    }

    async createCollection(siteId: string, name: string, singularName: string, slug: string, fields: any[]): Promise<WebflowCollection> {
        return this.fetch(`/sites/${siteId}/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                displayName: name,
                singularName: singularName,
                slug: slug,
                fields: fields
            })
        })
    }
    async createItem(collectionId: string, fieldData: any) {
        return this.fetch(`/collections/${collectionId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isArchived: false,
                isDraft: false,
                fieldData: fieldData
            })
        })
    }

    async getItems(collectionId: string) {
        return this.fetch(`/collections/${collectionId}/items`)
    }

    async deleteItem(collectionId: string, itemId: string) {
        return this.fetch(`/collections/${collectionId}/items/${itemId}`, {
            method: 'DELETE'
        })
    }

    async updateItem(collectionId: string, itemId: string, fieldData: any, options?: { isDraft?: boolean, isArchived?: boolean }) {
        const body: any = {
            fieldData: fieldData
        }

        if (options?.isDraft !== undefined) body.isDraft = options.isDraft
        if (options?.isArchived !== undefined) body.isArchived = options.isArchived

        // Default behavior if not specified? 
        // Previously hardcoded to false. Let's keep it safe.
        // If options are not provided, maybe don't send them? 
        // Webflow API usually defaults to staying same if not sent? Or defaults to false?
        // "isDraft": boolean (Optional)

        // Let's rely on explicit options. If not passed, undefined loops exclude them from stringify if I'm careful, 
        // but simple JSON.stringify keeps them if they are in object.

        return this.fetch(`/collections/${collectionId}/items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
    }

    async publishItems(collectionId: string, itemIds: string[]) {
        return this.fetch(`/collections/${collectionId}/items/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemIds: itemIds
            })
        })
    }
}
