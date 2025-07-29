#!/usr/bin/env node
// Sistema de Ragdolls Inteligentes - Demonstração em Node.js
// Versão simplificada dos conceitos implementados em Ruby

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    add(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return new Vector2D(this.x / mag, this.y / mag);
    }

    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}

class RagdollAI {
    constructor() {
        this.fear = 0.0;
        this.energy = 100.0;
        this.health = 100.0;
        this.personality = Math.random(); // 0 = covarde, 1 = corajoso
        this.lastJump = 0;
        this.injured = false;
        this.target = null;
        this.state = 'idle';
        this.color = this.generateRandomColor();
    }

    static get STATES() {
        return ['idle', 'fleeing', 'fighting', 'injured', 'parkour', 'cooperating', 'curious', 'dead'];
    }

    updateEmotion() {
        // Recuperação gradual
        this.fear = Math.max(this.fear - 0.1, 0);
        this.energy = Math.min(this.energy + 0.2, 100);
        if (this.injured) this.health = Math.min(this.health + 0.1, 100);

        // Remover estado de ferimento se curado
        if (this.injured && this.health > 80) {
            this.injured = false;
            console.log(`🩹 Ragdoll curado! Saúde: ${this.health.toFixed(1)}`);
        }

        // Resetar estado se não há ação específica
        if (this.state !== 'dead' && this.fear < 10 && this.energy > 50) {
            this.state = 'idle';
        }
    }

    takeDamage(force) {
        const damage = Math.min(force * 2, 20);
        this.health -= damage;
        this.fear += damage;

        if (this.health < 50) {
            this.injured = true;
            this.state = 'injured';
            console.log(`💥 Ragdoll ferido! Saúde: ${this.health.toFixed(1)}, Medo: ${this.fear.toFixed(1)}`);
        }

        if (this.health <= 0) {
            this.state = 'dead';
            console.log(`💀 Ragdoll morreu!`);
        }
    }

    canJump() {
        return Date.now() - this.lastJump > 1000 && this.energy > 20;
    }

    performJump() {
        this.lastJump = Date.now();
        this.energy -= 20;
        this.state = 'parkour';
        console.log(`🤸‍♂️ Ragdoll fazendo parkour! Energia: ${this.energy.toFixed(1)}`);
    }

    compatibilityWith(otherAI) {
        return Math.abs(this.personality - otherAI.personality);
    }

    describeState() {
        switch (this.state) {
            case 'idle':
                return `😐 Relaxado (Energia: ${this.energy.toFixed(1)})`;
            case 'fleeing':
                return `😱 Fugindo do mouse! (Medo: ${this.fear.toFixed(1)})`;
            case 'fighting':
                return `🥊 Brigando! (Energia: ${this.energy.toFixed(1)})`;
            case 'injured':
                return `🤕 Ferido (Saúde: ${this.health.toFixed(1)})`;
            case 'parkour':
                return `🤸‍♂️ Fazendo parkour!`;
            case 'cooperating':
                return `🤝 Cooperando com outro ragdoll`;
            case 'curious':
                return `🤔 Curioso sobre outro ragdoll`;
            case 'dead':
                return `💀 Morto`;
            default:
                return `❓ Estado desconhecido`;
        }
    }

    generateRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

class Ragdoll {
    constructor(x = 0, y = 0) {
        this.id = this.generateId();
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.ai = new RagdollAI();
        this.bodyParts = this.createBodyParts();
        console.log(`🎭 Novo ragdoll criado em ${this.position} com personalidade ${(this.ai.personality * 100).toFixed(0)}%`);
    }

    update(mousePosition, otherRagdolls, obstacles) {
        if (this.ai.state === 'dead') return;

        this.ai.updateEmotion();
        
        // Comportamento baseado na proximidade do mouse
        const mouseDistance = this.position.distanceTo(mousePosition);
        if (mouseDistance < 200) {
            this.fleeFromMouse(mousePosition);
        }

        // Parkour inteligente
        if (obstacles.length > 0 && this.ai.canJump()) {
            this.performParkour(obstacles);
        }

        // Interações com outros ragdolls
        this.interactWithOthers(otherRagdolls);

        // Aplicar comportamentos baseados no estado
        this.applyBehavior();

        // Atualizar posição
        this.updatePhysics();
    }

    fleeFromMouse(mousePosition) {
        const fleeDirection = this.position.subtract(mousePosition).normalize();
        const mouseDistance = this.position.distanceTo(mousePosition);
        
        // Força de fuga baseada na personalidade
        const fleeForce = (1 - this.ai.personality) * 0.5 + 0.2;
        const panicMultiplier = mouseDistance < 100 ? 2 : 1;
        
        const force = fleeDirection.multiply(fleeForce * panicMultiplier);
        this.applyForce(force);
        
        this.ai.fear = Math.min(this.ai.fear + 2, 100);
        this.ai.state = 'fleeing';
        
        console.log(`🏃‍♂️ Ragdoll ${this.id.substring(0, 8)} fugindo! Distância do mouse: ${mouseDistance.toFixed(1)}`);
    }

    performParkour(obstacles) {
        const nearbyObstacles = obstacles.filter(obs => this.position.distanceTo(obs) < 80);
        
        if (nearbyObstacles.length > 0) {
            this.ai.performJump();
            
            // Aplicar força de pulo
            const jumpForce = 0.8 + (this.ai.personality * 0.4);
            this.applyForce(new Vector2D(0, -jumpForce));
            
            // Força horizontal para superar obstáculo
            const obstacle = nearbyObstacles[0];
            const direction = this.position.x < obstacle.x ? 1 : -1;
            this.applyForce(new Vector2D(direction * 0.3, 0));
        }
    }

    interactWithOthers(otherRagdolls) {
        otherRagdolls.forEach(other => {
            if (other.id === this.id || other.ai.state === 'dead') return;
            
            const distance = this.position.distanceTo(other.position);
            if (distance >= 100) return;
            
            const compatibility = this.ai.compatibilityWith(other.ai);
            
            if (compatibility < 0.3) {
                this.cooperateWith(other);
            } else if (compatibility > 0.7) {
                this.fightWith(other);
            } else {
                this.beCuriousAbout(other);
            }
        });
    }

    cooperateWith(other) {
        // Ragdolls se ajudam mutuamente
        const direction = other.position.subtract(this.position).normalize().multiply(0.1);
        this.applyForce(direction);
        other.applyForce(direction.multiply(-1));
        
        this.ai.state = 'cooperating';
        other.ai.state = 'cooperating';
        
        // Cura mútua se feridos
        if (this.ai.injured) {
            this.ai.health = Math.min(this.ai.health + 0.5, 100);
        }
        if (other.ai.injured) {
            other.ai.health = Math.min(other.ai.health + 0.5, 100);
        }
        
        console.log(`🤝 Ragdolls ${this.id.substring(0, 8)} e ${other.id.substring(0, 8)} cooperando!`);
    }

    fightWith(other) {
        // Ragdolls brigam
        const forceDirection = other.position.subtract(this.position).normalize().multiply(0.3);
        this.applyForce(forceDirection);
        other.applyForce(forceDirection.multiply(-1));
        
        this.ai.state = 'fighting';
        other.ai.state = 'fighting';
        this.ai.energy -= 1;
        other.ai.energy -= 1;
        
        console.log(`🥊 Ragdolls ${this.id.substring(0, 8)} e ${other.id.substring(0, 8)} brigando!`);
    }

    beCuriousAbout(other) {
        // Ragdolls se observam com curiosidade
        this.ai.state = 'curious';
        other.ai.state = 'curious';
        
        // Movimento sutil de aproximação
        const direction = other.position.subtract(this.position).normalize().multiply(0.05);
        this.applyForce(direction);
        other.applyForce(direction.multiply(-1));
        
        console.log(`🤔 Ragdolls ${this.id.substring(0, 8)} e ${other.id.substring(0, 8)} curiosos um sobre o outro`);
    }

    applyBehavior() {
        switch (this.ai.state) {
            case 'injured':
                // Movimento mais lento e errático
                if (Math.random() < 0.1) {
                    const randomForce = new Vector2D((Math.random() - 0.5) * 0.1, 0);
                    this.applyForce(randomForce);
                }
                break;
            case 'idle':
                // Movimento aleatório ocasional
                if (Math.random() < 0.02) {
                    const randomForce = new Vector2D((Math.random() - 0.5) * 0.2, 0);
                    this.applyForce(randomForce);
                }
                break;
        }
    }

    applyForce(force) {
        this.velocity = this.velocity.add(force);
    }

    updatePhysics() {
        // Aplicar fricção
        this.velocity = this.velocity.multiply(0.98);
        
        // Atualizar posição
        this.position = this.position.add(this.velocity);
        
        // Limites da tela (assumindo 800x600)
        this.position.x = Math.max(0, Math.min(800, this.position.x));
        this.position.y = Math.max(0, Math.min(600, this.position.y));
    }

    handleCollision(impactForce) {
        this.ai.takeDamage(impactForce);
    }

    statusReport() {
        console.log(`🎭 Ragdoll ${this.id.substring(0, 8)}:`);
        console.log(`   📍 Posição: ${this.position}`);
        console.log(`   🏃 Velocidade: ${this.velocity}`);
        console.log(`   🧠 Estado: ${this.ai.describeState()}`);
        console.log(`   💪 Personalidade: ${(this.ai.personality * 100).toFixed(0)}% corajoso`);
        console.log();
    }

    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    createBodyParts() {
        return {
            head: { radius: 15, color: this.ai.color },
            torso: { width: 20, height: 40, color: '#4a90e2' },
            leftArm: { width: 8, height: 25, color: '#5a9bd4' },
            rightArm: { width: 8, height: 25, color: '#5a9bd4' },
            leftLeg: { width: 10, height: 30, color: '#3a7bc8' },
            rightLeg: { width: 10, height: 30, color: '#3a7bc8' }
        };
    }

    toJSON() {
        return {
            id: this.id,
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            ai: {
                state: this.ai.state,
                health: this.ai.health,
                energy: this.ai.energy,
                fear: this.ai.fear,
                personality: this.ai.personality,
                injured: this.ai.injured,
                color: this.ai.color
            }
        };
    }
}

class PhysicsWorld {
    constructor() {
        this.ragdolls = [];
        this.mousePosition = new Vector2D(400, 300);
        this.obstacles = [];
        this.running = false;
        console.log('🌍 Mundo físico inicializado!');
    }

    addRagdoll(x = null, y = null) {
        x = x || Math.random() * 700 + 50;
        y = y || Math.random() * 500 + 50;
        const ragdoll = new Ragdoll(x, y);
        this.ragdolls.push(ragdoll);
        console.log(`✅ Ragdoll adicionado! Total: ${this.ragdolls.length}`);
        return ragdoll;
    }

    addObstacle(x, y) {
        this.obstacles.push(new Vector2D(x, y));
        console.log(`🧱 Obstáculo adicionado em (${x}, ${y})`);
    }

    updateMousePosition(x, y) {
        this.mousePosition = new Vector2D(x, y);
    }

    simulateStep() {
        if (this.ragdolls.length === 0) return;

        this.ragdolls.forEach(ragdoll => {
            ragdoll.update(this.mousePosition, this.ragdolls, this.obstacles);
        });

        // Simular colisões
        this.simulateCollisions();
    }

    simulateCollisions() {
        this.ragdolls.forEach(ragdoll => {
            // Colisão com paredes
            if (ragdoll.position.x <= 0 || ragdoll.position.x >= 800 ||
                ragdoll.position.y <= 0 || ragdoll.position.y >= 600) {
                const impactForce = ragdoll.velocity.magnitude();
                if (impactForce > 5) {
                    ragdoll.handleCollision(impactForce);
                }
            }

            // Colisões entre ragdolls
            this.ragdolls.forEach(other => {
                if (ragdoll.id === other.id) return;
                
                const distance = ragdoll.position.distanceTo(other.position);
                if (distance < 30) { // Colisão detectada
                    const impactForce = (ragdoll.velocity.magnitude() + other.velocity.magnitude()) / 2;
                    if (impactForce > 3) {
                        ragdoll.handleCollision(impactForce * 0.5);
                        other.handleCollision(impactForce * 0.5);
                    }
                }
            });
        });
    }

    statusReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🌍 RELATÓRIO DO MUNDO FÍSICO');
        console.log('='.repeat(50));
        console.log(`🎭 Ragdolls ativos: ${this.ragdolls.filter(r => r.ai.state !== 'dead').length}/${this.ragdolls.length}`);
        console.log(`🖱️ Posição do mouse: ${this.mousePosition}`);
        console.log(`🧱 Obstáculos: ${this.obstacles.length}`);
        console.log();
        
        this.ragdolls.forEach(ragdoll => ragdoll.statusReport());
        
        // Estatísticas dos estados
        const states = {};
        this.ragdolls.forEach(ragdoll => {
            const state = ragdoll.ai.state;
            states[state] = (states[state] || 0) + 1;
        });
        
        console.log('📊 ESTATÍSTICAS DOS ESTADOS:');
        Object.entries(states).forEach(([state, count]) => {
            console.log(`   ${state}: ${count} ragdolls`);
        });
        console.log('='.repeat(50) + '\n');
    }

    exportState() {
        return {
            timestamp: Date.now(),
            mousePosition: { x: this.mousePosition.x, y: this.mousePosition.y },
            ragdolls: this.ragdolls.map(r => r.toJSON()),
            obstacles: this.obstacles.map(obs => ({ x: obs.x, y: obs.y }))
        };
    }
}

// Demonstração do sistema
function runDemo() {
    console.log('🎮 SIMULADOR DE RAGDOLLS INTELIGENTES EM NODE.JS');
    console.log('='.repeat(50));
    
    // Criar mundo
    const world = new PhysicsWorld();
    
    // Adicionar alguns ragdolls
    for (let i = 0; i < 3; i++) {
        world.addRagdoll();
    }
    
    // Adicionar obstáculos
    world.addObstacle(400, 500);
    world.addObstacle(200, 300);
    
    // Simular movimento do mouse
    console.log('\n🖱️ Simulando movimento do mouse...');
    const mousePositions = [
        [100, 100], [200, 150], [300, 200], [400, 250], [500, 300],
        [600, 350], [700, 400], [600, 450], [500, 400], [400, 350]
    ];
    
    let frameIndex = 0;
    
    const simulationInterval = setInterval(() => {
        if (frameIndex >= mousePositions.length) {
            clearInterval(simulationInterval);
            
            console.log('\n🎯 Simulação concluída!');
            world.statusReport();
            
            // Exportar estado final
            const finalState = world.exportState();
            console.log('\n💾 Estado final exportado:');
            console.log(JSON.stringify(finalState, null, 2));
            
            return;
        }
        
        const [x, y] = mousePositions[frameIndex];
        console.log(`\n⏱️ Frame ${frameIndex + 1}/${mousePositions.length}`);
        world.updateMousePosition(x, y);
        world.simulateStep();
        
        // Relatório a cada 3 frames
        if ((frameIndex + 1) % 3 === 0) {
            world.statusReport();
        }
        
        frameIndex++;
    }, 500); // 500ms entre frames para visualização
}

// Executar demonstração se este arquivo for executado diretamente
if (require.main === module) {
    runDemo();
}

module.exports = { Vector2D, RagdollAI, Ragdoll, PhysicsWorld };